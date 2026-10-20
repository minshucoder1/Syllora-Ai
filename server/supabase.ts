import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Subject } from './db.js';

let supabaseClient: SupabaseClient | null = null;

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
    console.log('[Supabase] Initialized Supabase PostgreSQL and Storage client successfully.');
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
  }
} else {
  console.log('[Supabase] Environment variables SUPABASE_URL and SUPABASE_ANON_KEY/SERVICE_ROLE_KEY not yet configured. Operating with persistent database engine.');
}

export function isSupabaseConfigured(): boolean {
  return !!supabaseClient;
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient;
}

/**
 * Saves uploaded file to private local filesystem and Supabase Storage bucket (if configured)
 */
export async function saveSyllabusFile(
  userId: string,
  fileName: string,
  base64Data: string,
  mimeType: string
): Promise<{ localPath: string; storagePath?: string }> {
  const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads', userId);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const localFilePath = path.join(uploadsDir, safeFileName);
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(localFilePath, buffer);

  let storagePath: string | undefined = undefined;

  if (supabaseClient) {
    try {
      const bucketName = 'syllabus_files';
      const remotePath = `${userId}/${safeFileName}`;

      const { data, error } = await supabaseClient.storage
        .from(bucketName)
        .upload(remotePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!error && data) {
        storagePath = data.path;
      } else {
        console.warn('[Supabase Storage] Notice uploading syllabus file:', error?.message);
      }
    } catch (e) {
      console.warn('[Supabase Storage] Upload caught error:', e);
    }
  }

  return { localPath: localFilePath, storagePath };
}

/**
 * Deletes syllabus file from private local storage and Supabase Storage
 */
export async function deleteSyllabusFile(userId: string, localFilePath?: string, storagePath?: string): Promise<void> {
  if (localFilePath && fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);
    } catch (e) {
      console.warn('Failed to delete local file:', e);
    }
  }

  if (supabaseClient && storagePath) {
    try {
      await supabaseClient.storage.from('syllabus_files').remove([storagePath]);
    } catch (e) {
      console.warn('Failed to delete Supabase storage file:', e);
    }
  }
}

/**
 * Syncs a subject record to Supabase Cloud (Storage bucket & PostgreSQL table)
 */
export async function syncSubjectToSupabase(subject: Subject): Promise<boolean> {
  if (!supabaseClient) return false;

  let storageSuccess = false;
  let pgSuccess = false;

  // 1. Permanent Cloud Storage: Save complete subject record to private Supabase Storage
  try {
    const remoteRecordPath = `${subject.userId}/subjects/${subject.id}.json`;
    const recordBuffer = Buffer.from(JSON.stringify(subject, null, 2), 'utf-8');
    const { error: storageErr } = await supabaseClient.storage
      .from('syllabus_files')
      .upload(remoteRecordPath, recordBuffer, {
        contentType: 'application/json',
        upsert: true,
      });

    if (!storageErr) {
      storageSuccess = true;
      console.log(`[Supabase Cloud] Subject "${subject.name}" (${subject.id}) permanently synced to cloud storage for user ${subject.userId}`);
    } else {
      console.warn('[Supabase Cloud Storage] Notice syncing subject record:', storageErr.message);
    }
  } catch (err) {
    console.warn('[Supabase Cloud Storage] syncSubjectToSupabase exception:', err);
  }

  // 2. Also upsert to Supabase PostgreSQL subjects table if table exists
  try {
    const payload = {
      id: subject.id,
      user_id: subject.userId,
      title: subject.name,
      code: subject.code || null,
      description: subject.description || null,
      exam_date: subject.examDate || null,
      syllabus_text: subject.syllabusText || subject.rawSyllabusText || null,
      syllabus_file_path: subject.uploadedFilePath || null,
      syllabus_file_name: subject.uploadedFileName || null,
      syllabus_file_type: subject.syllabusFileType || null,
      analysis_status: subject.analysisStatus || 'completed',
      units_json: subject.units || [],
      archived: !!subject.archived,
      archived_at: subject.archivedAt || null,
      created_at: subject.createdAt,
      updated_at: subject.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabaseClient.from('subjects').upsert(payload);
    if (!error) {
      pgSuccess = true;
    }
  } catch (err) {
    // If PostgreSQL table has not yet been migrated, cloud storage provides full persistence
  }

  return storageSuccess || pgSuccess;
}

/**
 * Saves and syncs generated study materials for a subject to Supabase Cloud Storage
 */
export async function syncStudyMaterialsToCloudStorage(
  subjectId: string,
  userId: string,
  materials: {
    notes?: any[];
    questions?: any[];
    mcqs?: any[];
    flashcards?: any[];
    mindmaps?: any[];
    cheatsheets?: any[];
  }
): Promise<boolean> {
  if (!supabaseClient || !userId || !subjectId) return false;

  try {
    const remotePath = `${userId}/study_materials/${subjectId}.json`;
    const buffer = Buffer.from(JSON.stringify(materials, null, 2), 'utf-8');
    const { error } = await supabaseClient.storage
      .from('syllabus_files')
      .upload(remotePath, buffer, {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      console.warn('[Supabase Cloud Storage] Error syncing study materials:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Cloud Storage] syncStudyMaterials exception:', err);
    return false;
  }
}

/**
 * Automatically restores all syllabus records and study materials belonging to an authenticated user from Supabase Cloud
 */
export async function fetchUserSyllabusesFromCloud(userId: string): Promise<{
  subjects: Subject[];
  studyMaterials: Record<string, any>;
}> {
  if (!supabaseClient || !userId) {
    return { subjects: [], studyMaterials: {} };
  }

  const restoredSubjects: Subject[] = [];
  const restoredMaterials: Record<string, any> = {};

  try {
    // 1. Fetch from Supabase Cloud Storage bucket
    const { data: fileList, error: listError } = await supabaseClient.storage
      .from('syllabus_files')
      .list(`${userId}/subjects`);

    if (!listError && Array.isArray(fileList) && fileList.length > 0) {
      for (const item of fileList) {
        if (!item.name || !item.name.endsWith('.json')) continue;
        try {
          const { data: blob, error: downloadErr } = await supabaseClient.storage
            .from('syllabus_files')
            .download(`${userId}/subjects/${item.name}`);

          if (!downloadErr && blob) {
            const jsonText = await blob.text();
            const subjectObj: Subject = JSON.parse(jsonText);
            if (subjectObj && subjectObj.id && subjectObj.userId === userId) {
              restoredSubjects.push(subjectObj);
            }
          }
        } catch (downloadCatch) {
          console.warn(`[Supabase Cloud] Error downloading subject file ${item.name}:`, downloadCatch);
        }
      }
    }

    // 2. Fetch associated study materials from Supabase Storage
    const { data: matList, error: matListErr } = await supabaseClient.storage
      .from('syllabus_files')
      .list(`${userId}/study_materials`);

    if (!matListErr && Array.isArray(matList) && matList.length > 0) {
      for (const matItem of matList) {
        if (!matItem.name || !matItem.name.endsWith('.json')) continue;
        try {
          const subjectId = matItem.name.replace('.json', '');
          const { data: blob, error: downloadErr } = await supabaseClient.storage
            .from('syllabus_files')
            .download(`${userId}/study_materials/${matItem.name}`);

          if (!downloadErr && blob) {
            const matJson = JSON.parse(await blob.text());
            restoredMaterials[subjectId] = matJson;
          }
        } catch {
          // ignore
        }
      }
    }

    // 3. If PostgreSQL subjects table has records, merge them
    try {
      const { data: pgSubjects, error: pgErr } = await supabaseClient
        .from('subjects')
        .select('*')
        .eq('user_id', userId);

      if (!pgErr && Array.isArray(pgSubjects)) {
        for (const row of pgSubjects) {
          if (!restoredSubjects.some((s) => s.id === row.id)) {
            restoredSubjects.push({
              id: row.id,
              userId: row.user_id,
              name: row.title,
              code: row.code || '',
              description: row.description || '',
              examDate: row.exam_date || '',
              syllabusText: row.syllabus_text || '',
              uploadedFilePath: row.syllabus_file_path || '',
              uploadedFileName: row.syllabus_file_name || '',
              syllabusFileType: row.syllabus_file_type || '',
              analysisStatus: row.analysis_status || 'completed',
              course: row.course || 'B.Tech',
              semester: row.semester || '1st Semester',
              units: Array.isArray(row.units_json) ? row.units_json : [],
              archived: !!row.archived,
              archivedAt: row.archived_at || undefined,
              createdAt: row.created_at || new Date().toISOString(),
              updatedAt: row.updated_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      // Table may not exist
    }
  } catch (err) {
    console.warn('[Supabase Cloud Restore] Exception:', err);
  }

  return { subjects: restoredSubjects, studyMaterials: restoredMaterials };
}

/**
 * Deletes subject and cascading records from Supabase Cloud (Storage and PostgreSQL)
 */
export async function deleteSubjectFromSupabase(
  subjectId: string,
  userId: string,
  storagePath?: string
): Promise<boolean> {
  if (!supabaseClient) return false;

  // 1. Remove subject record and study materials from Supabase Cloud Storage
  try {
    const filesToRemove = [
      `${userId}/subjects/${subjectId}.json`,
      `${userId}/study_materials/${subjectId}.json`,
    ];
    if (storagePath) {
      filesToRemove.push(storagePath);
    }
    await supabaseClient.storage.from('syllabus_files').remove(filesToRemove);
  } catch (err) {
    console.warn('[Supabase Storage] deleteSubject notice:', err);
  }

  // 2. Delete from PostgreSQL table
  try {
    await supabaseClient
      .from('subjects')
      .delete()
      .match({ id: subjectId, user_id: userId });
  } catch (err) {
    // ignore
  }

  return true;
}

/**
 * Creates an account in Supabase Auth with email, password, phone, and profile metadata
 * Note: Setting top-level phone populates the Phone column in Supabase Dashboard → Authentication → Users
 */
export async function createSupabaseAuthUser(params: {
  email: string;
  password?: string;
  phone?: string;
  metadata?: Record<string, any>;
}): Promise<{ user?: any; error?: string }> {
  if (!supabaseClient) return { error: 'Supabase client not initialized' };

  try {
    const payload: any = {
      email: params.email.trim().toLowerCase(),
      password: params.password,
      email_confirm: true,
      user_metadata: params.metadata || {},
    };

    // Setting top-level phone populates the Phone column in Supabase Dashboard
    if (params.phone) {
      payload.phone = params.phone;
      payload.phone_confirm = true;
    }

    const { data, error } = await supabaseClient.auth.admin.createUser(payload);

    if (error) {
      return { error: error.message };
    }
    return { user: data.user };
  } catch (err: any) {
    return { error: err.message || 'Supabase Auth creation failed' };
  }
}

/**
 * Updates a user's phone in Supabase Auth (populates Phone column in Supabase Dashboard)
 */
export async function updateSupabaseAuthPhone(
  userIdOrEmail: string,
  phone: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  if (!supabaseClient || !phone) return false;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrEmail);
    let targetUserId = userIdOrEmail;

    if (!isUuid) {
      const { data } = await supabaseClient.auth.admin.listUsers();
      const matched = data?.users?.find((u) => u.email?.toLowerCase() === userIdOrEmail.toLowerCase());
      if (matched) {
        targetUserId = matched.id;
      } else {
        return false;
      }
    }

    const payload: any = {
      phone,
      phone_confirm: true,
    };
    if (metadata) {
      payload.user_metadata = metadata;
    }

    const { error } = await supabaseClient.auth.admin.updateUserById(targetUserId, payload);
    if (error) {
      console.warn('[Supabase Auth] Notice updating phone:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase Auth] Exception updating phone:', e);
    return false;
  }
}

/**
 * Robust profile creation / sync in Supabase PostgreSQL 'profiles' table.
 * Explicitly saves sanitized phone number, country code, and academic attributes.
 * Handles race conditions (foreign-key constraints or auth trigger latency) via exponential backoff retries.
 */
export async function createSupabaseProfileWithRetry(profile: {
  id: string;
  email?: string;
  name: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  phone?: string;
  college?: string;
  course?: string;
  branch?: string;
  year?: string;
  semester?: string;
  preferredLanguage?: string;
  examDate?: string;
}): Promise<boolean> {
  if (!supabaseClient) return false;

  const payload = {
    id: profile.id,
    email: profile.email || '',
    name: profile.name,
    phone_country_code: profile.phoneCountryCode || '+91',
    phone_number: profile.phoneNumber || '',
    phone: profile.phone || '',
    college: profile.college || '',
    course: profile.course || 'B.Tech',
    branch: profile.branch || 'Computer Science',
    year: profile.year || '1st Year',
    semester: profile.semester || '1st Semester',
    preferred_language: profile.preferredLanguage || 'English',
    updated_at: new Date().toISOString(),
  };

  const backoffDelays = [150, 400, 900, 1800];
  for (let attempt = 0; attempt < backoffDelays.length; attempt++) {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (!error) {
        return true;
      }

      console.warn(
        `[Supabase Profile Upsert] Attempt ${attempt + 1}/${backoffDelays.length} notice: ${error.message}`
      );
      if (attempt < backoffDelays.length - 1) {
        await new Promise((r) => setTimeout(r, backoffDelays[attempt]));
      }
    } catch (e: any) {
      console.warn(
        `[Supabase Profile Upsert] Attempt ${attempt + 1} exception:`,
        e?.message || e
      );
      if (attempt < backoffDelays.length - 1) {
        await new Promise((r) => setTimeout(r, backoffDelays[attempt]));
      }
    }
  }
  return false;
}

/**
 * Syncs user profile to profiles table in Supabase PostgreSQL (if available)
 */
export async function syncUserProfileToSupabase(user: any): Promise<boolean> {
  if (!supabaseClient || !user) return false;
  return createSupabaseProfileWithRetry({
    id: user.id,
    email: user.email,
    name: user.name,
    phoneCountryCode: user.phoneCountryCode,
    phoneNumber: user.phoneNumber,
    phone: user.phone,
    college: user.college,
    course: user.course,
    branch: user.branch,
    year: user.year,
    semester: user.semester,
    preferredLanguage: user.preferredLanguage,
    examDate: user.examDate,
  });
}

/**
 * Authenticates user credentials against Supabase Auth
 */
export async function signInSupabaseAuthUser(params: {
  email: string;
  password?: string;
}): Promise<{ user?: any; session?: any; error?: string }> {
  if (!supabaseClient || !params.password) return { error: 'Supabase client not initialized or missing password' };

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: params.email.trim().toLowerCase(),
      password: params.password,
    });

    if (error) {
      return { error: error.message };
    }
    return { user: data.user, session: data.session };
  } catch (err: any) {
    return { error: err.message || 'Supabase Auth sign-in failed' };
  }
}

/**
 * Validates a Supabase JWT access token and returns the authenticated user
 */
export async function getSupabaseUserByToken(token: string): Promise<any | null> {
  if (!supabaseClient || !token) return null;

  try {
    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Updates a user's password in Supabase Auth
 */
export async function updateSupabaseAuthPassword(userIdOrEmail: string, newPassword: string): Promise<boolean> {
  if (!supabaseClient) return false;

  try {
    // If it looks like a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrEmail);
    if (isUuid) {
      const { error } = await supabaseClient.auth.admin.updateUserById(userIdOrEmail, { password: newPassword });
      return !error;
    } else {
      // Find by email
      const { data } = await supabaseClient.auth.admin.listUsers();
      const matched = data?.users?.find((u) => u.email?.toLowerCase() === userIdOrEmail.toLowerCase());
      if (matched) {
        const { error } = await supabaseClient.auth.admin.updateUserById(matched.id, { password: newPassword });
        return !error;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Generates signed download URL for private files in Supabase Storage
 */
export async function getSyllabusFileDownloadUrl(storagePath: string): Promise<string | null> {
  if (!supabaseClient || !storagePath) return null;
  try {
    const { data, error } = await supabaseClient.storage.from('syllabus_files').createSignedUrl(storagePath, 3600);
    if (error) return null;
    return data?.signedUrl || null;
  } catch {
    return null;
  }
}

/**
 * Syncs generated study pack category items to Supabase PostgreSQL tables
 */
export async function syncStudyPackCategoryToSupabase(
  category: string,
  subjectId: string,
  userId: string,
  items: any[]
): Promise<boolean> {
  if (!supabaseClient || !Array.isArray(items) || items.length === 0) return false;

  try {
    switch (category) {
      case 'notes': {
        const rows = items.map((n) => ({
          id: n.id,
          topic_id: n.topicId || `top_default_${n.id}`,
          subject_id: subjectId,
          user_id: userId,
          title: n.title,
          definition: n.definition || null,
          introduction: n.introduction || null,
          key_concepts: n.keyConcepts || [],
          explanation: n.explanation || '',
          real_life_example: n.realLifeExample || null,
          formula: n.formula || null,
          algorithm: n.algorithm || null,
          complexity: n.complexity || null,
          applications: n.applications || [],
          advantages: n.advantages || [],
          limitations: n.limitations || [],
          exam_points: n.examPoints || [],
          quick_revision: n.quickRevision || null,
          diagram_svg_or_ascii: n.diagramSvgOrAscii || null,
          version: 1,
          created_at: n.createdAt || new Date().toISOString(),
          updated_at: n.updatedAt || new Date().toISOString(),
        }));
        await supabaseClient.from('notes').upsert(rows);
        return true;
      }

      case 'questions':
      case 'numericals': {
        const rows = items.map((q) => ({
          id: q.id,
          topic_id: q.topicId || null,
          subject_id: subjectId,
          user_id: userId,
          question: q.question,
          answer: q.answer,
          marks: q.marks || 5,
          difficulty: q.difficulty || 'Medium',
          priority: q.priority || 'High',
          type: q.type || (q.isNumerical ? 'Numerical Problem' : 'Conceptual'),
          category: q.category || (q.isNumerical ? 'numerical' : 'all'),
          is_numerical: !!q.isNumerical,
          saved: true,
          created_at: q.createdAt || new Date().toISOString(),
        }));
        await supabaseClient.from('questions').upsert(rows);
        return true;
      }

      case 'mcqs': {
        const rows = items.map((m) => ({
          id: m.id,
          topic_id: m.topicId || null,
          subject_id: subjectId,
          user_id: userId,
          question: m.question,
          option_a: m.optionA,
          option_b: m.optionB,
          option_c: m.optionC,
          option_d: m.optionD,
          correct_answer: m.correctAnswer,
          explanation: m.explanation || null,
          difficulty: m.difficulty || 'Medium',
          created_at: m.createdAt || new Date().toISOString(),
        }));
        await supabaseClient.from('mcqs').upsert(rows);
        return true;
      }

      case 'flashcards': {
        const rows = items.map((f) => ({
          id: f.id,
          topic_id: f.topicId || null,
          subject_id: subjectId,
          user_id: userId,
          front: f.front,
          back: f.back,
          key_takeaway: f.keyTakeaway || null,
          learned: !!f.learned,
          difficulty: f.difficulty || 'Medium',
          created_at: f.createdAt || new Date().toISOString(),
        }));
        await supabaseClient.from('flashcards').upsert(rows);
        return true;
      }

      case 'mindmap': {
        const rows = items.map((mm) => ({
          id: mm.id,
          subject_id: subjectId,
          user_id: userId,
          topic_or_unit_name: mm.topicOrUnitName || 'Main Concept',
          root_json: mm.root,
          created_at: mm.createdAt || new Date().toISOString(),
        }));
        await supabaseClient.from('mindmaps').upsert(rows);
        return true;
      }

      case 'cheatsheet': {
        const rows = items.map((cs) => ({
          id: cs.id,
          subject_id: subjectId,
          user_id: userId,
          title: cs.title,
          summary: cs.summary || null,
          formulas: cs.formulas || [],
          key_points: cs.keyPoints || [],
          diagrams: cs.diagrams || [],
          created_at: cs.createdAt || new Date().toISOString(),
        }));
        await supabaseClient.from('cheatsheets').upsert(rows);
        return true;
      }

      default:
        return false;
    }
  } catch (err) {
    console.warn(`[Supabase] Sync notice for study pack ${category}:`, err);
    return false;
  }
}
