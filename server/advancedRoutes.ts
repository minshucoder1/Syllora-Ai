import { Request, Response, Express } from 'express';
import {
  readDb,
  writeDb,
  User,
  LibraryDocument,
  LibraryConversation,
  LibraryMessage,
  LibraryCitation,
  SolvedProblem,
  PreviousYearPaper,
  PaperAnalysisReport,
  OfflineSyncRecord,
} from './db.js';
import {
  processLibraryDocumentAI,
  chatWithLibraryRAGAI,
  ocrHandwrittenQuestionAI,
  solveHandwrittenProblemAI,
  extractPaperQuestionsAI,
  analyzePreviousYearPapersCollectionAI,
} from './aiAdvanced.js';
import { saveSyllabusFile, isSupabaseConfigured } from './supabase.js';

export function registerAdvancedRoutes(
  app: Express,
  getSessionUser: (req: Request, db: any) => User | null
) {
  // =========================================================================
  // 1. CHAT WITH YOUR ENTIRE LIBRARY ENDPOINTS
  // =========================================================================

  // List all user's library documents
  app.get('/api/library/documents', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const documents = (db.libraryDocuments || [])
      .filter((d) => d.userId === user.id)
      .map((d) => ({
        id: d.id,
        name: d.name,
        fileType: d.fileType,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        collectionName: d.collectionName || 'General',
        status: d.status,
        errorMessage: d.errorMessage,
        pageCount: d.pageCount || 1,
        chunksCount: d.chunks?.length || 0,
        uploadedAt: d.uploadedAt,
        updatedAt: d.updatedAt,
      }));

    res.json({ success: true, documents });
  });

  // Upload and process a new document
  app.post('/api/library/documents/upload', async (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const {
      name,
      fileType = 'pdf',
      mimeType = 'application/pdf',
      sizeBytes = 0,
      base64Data,
      rawText,
      collectionName = 'General',
    } = req.body;

    if (!name || (!base64Data && !rawText)) {
      return res.status(400).json({ error: 'Document name and content are required.' });
    }

    const docId = `lib_doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newDoc: LibraryDocument = {
      id: docId,
      userId: user.id,
      name: name.trim(),
      fileType,
      mimeType,
      sizeBytes: Number(sizeBytes) || 0,
      collectionName: collectionName.trim() || 'General',
      status: 'processing',
      pageCount: 1,
      chunks: [],
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.libraryDocuments = db.libraryDocuments || [];
    db.libraryDocuments.unshift(newDoc);
    writeDb(db);

    // Save to private Supabase storage asynchronously if available
    if (isSupabaseConfigured() && base64Data) {
      saveSyllabusFile(user.id, `library_${name}`, base64Data, mimeType).catch((e) =>
        console.warn('[Library Supabase Storage Notice]:', e)
      );
    }

    // Trigger AI text extraction & chunking
    try {
      const result = await processLibraryDocumentAI({
        fileName: name,
        mimeType,
        base64Data,
        rawText,
      });

      const updatedDb = readDb();
      const targetDoc = (updatedDb.libraryDocuments || []).find((d) => d.id === docId);
      if (targetDoc) {
        targetDoc.status = 'ready';
        targetDoc.pageCount = result.pageCount;
        targetDoc.extractedText = result.extractedText;
        targetDoc.chunks = result.chunks;
        targetDoc.updatedAt = new Date().toISOString();
        writeDb(updatedDb);
      }

      res.status(201).json({
        success: true,
        document: {
          id: docId,
          name: newDoc.name,
          collectionName: newDoc.collectionName,
          status: 'ready',
          pageCount: result.pageCount,
          chunksCount: result.chunks.length,
          uploadedAt: newDoc.uploadedAt,
        },
      });
    } catch (err: any) {
      console.error('[Library Document Processing Error]:', err);
      const updatedDb = readDb();
      const targetDoc = (updatedDb.libraryDocuments || []).find((d) => d.id === docId);
      if (targetDoc) {
        targetDoc.status = 'failed';
        targetDoc.errorMessage = err.message || 'Processing failed';
        writeDb(updatedDb);
      }
      res.status(500).json({
        error: 'Failed to process document: ' + (err.message || 'Unknown processing error'),
        docId,
      });
    }
  });

  // Reprocess failed document
  app.post('/api/library/documents/:id/reprocess', async (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const doc = (db.libraryDocuments || []).find((d) => d.id === req.params.id);
    if (!doc || doc.userId !== user.id) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    doc.status = 'processing';
    doc.errorMessage = undefined;
    writeDb(db);

    try {
      const result = await processLibraryDocumentAI({
        fileName: doc.name,
        mimeType: doc.mimeType,
        rawText: doc.extractedText,
      });

      doc.status = 'ready';
      doc.pageCount = result.pageCount;
      doc.chunks = result.chunks;
      doc.updatedAt = new Date().toISOString();
      writeDb(db);

      res.json({ success: true, document: doc });
    } catch (err: any) {
      doc.status = 'failed';
      doc.errorMessage = err.message || 'Reprocessing failed';
      writeDb(db);
      res.status(500).json({ error: err.message || 'Reprocessing failed' });
    }
  });

  // Delete document
  app.delete('/api/library/documents/:id', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const initialLen = (db.libraryDocuments || []).length;
    db.libraryDocuments = (db.libraryDocuments || []).filter(
      (d) => !(d.id === req.params.id && d.userId === user.id)
    );

    if (db.libraryDocuments.length === initialLen) {
      return res.status(404).json({ error: 'Document not found or permission denied.' });
    }

    writeDb(db);
    res.json({ success: true, message: 'Document deleted successfully.' });
  });

  // Conversations listing
  app.get('/api/library/conversations', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const conversations = (db.libraryConversations || [])
      .filter((c) => c.userId === user.id)
      .map((c) => ({
        id: c.id,
        title: c.title,
        selectedDocumentIds: c.selectedDocumentIds || [],
        collectionName: c.collectionName,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messagesCount: c.messages?.length || 0,
      }));

    res.json({ success: true, conversations });
  });

  // Create new conversation
  app.post('/api/library/conversations', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { title = 'New Library Chat', selectedDocumentIds = [], collectionName } = req.body;
    const newConv: LibraryConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      title: title.trim(),
      selectedDocumentIds,
      collectionName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    db.libraryConversations = db.libraryConversations || [];
    db.libraryConversations.unshift(newConv);
    writeDb(db);

    res.status(201).json({ success: true, conversation: newConv });
  });

  // Delete conversation
  app.delete('/api/library/conversations/:id', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    db.libraryConversations = (db.libraryConversations || []).filter(
      (c) => !(c.id === req.params.id && c.userId === user.id)
    );
    writeDb(db);
    res.json({ success: true, message: 'Conversation deleted.' });
  });

  // Get specific conversation messages
  app.get('/api/library/conversations/:id', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const conv = (db.libraryConversations || []).find(
      (c) => c.id === req.params.id && c.userId === user.id
    );
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    res.json({ success: true, conversation: conv });
  });

  // Send message and get RAG answer with citations
  app.post('/api/library/chat', async (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const {
      conversationId,
      query,
      selectedDocumentIds = [],
      collectionName,
      preferredLanguage = user.preferredLanguage || 'English',
    } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required.' });
    }

    // 1. Gather all chunks matching target scope
    const userDocs = (db.libraryDocuments || []).filter((d) => d.userId === user.id && d.status === 'ready');
    let candidateDocs = userDocs;

    if (selectedDocumentIds && selectedDocumentIds.length > 0) {
      candidateDocs = candidateDocs.filter((d) => selectedDocumentIds.includes(d.id));
    } else if (collectionName && collectionName !== 'All Documents') {
      candidateDocs = candidateDocs.filter((d) => d.collectionName === collectionName);
    }

    // 2. Perform Keyword & Semantic relevance scoring across chunks
    const queryTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2);

    const scoredChunks: {
      docId: string;
      docName: string;
      pageNumber?: number;
      content: string;
      score: number;
    }[] = [];

    candidateDocs.forEach((doc) => {
      (doc.chunks || []).forEach((chunk) => {
        const textLower = chunk.content.toLowerCase();
        let score = 0;
        queryTokens.forEach((token: string) => {
          if (textLower.includes(token)) score += 2;
        });
        if (chunk.sectionHeading && queryTokens.some((t: string) => chunk.sectionHeading!.toLowerCase().includes(t))) {
          score += 3;
        }
        if (score > 0) {
          scoredChunks.push({
            docId: doc.id,
            docName: doc.name,
            pageNumber: chunk.pageNumber,
            content: chunk.content,
            score,
          });
        }
      });
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    // Take top 6 most relevant chunks
    const relevantChunks = scoredChunks.slice(0, 6);

    // 3. Find or create conversation
    let conv = (db.libraryConversations || []).find(
      (c) => c.id === conversationId && c.userId === user.id
    );

    if (!conv) {
      conv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        title: query.slice(0, 45) + (query.length > 45 ? '...' : ''),
        selectedDocumentIds,
        collectionName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      db.libraryConversations = db.libraryConversations || [];
      db.libraryConversations.unshift(conv);
    }

    // 4. Run RAG AI with citation extraction
    try {
      const history = (conv.messages || []).map((m) => ({ role: m.role, content: m.content }));
      const aiResult = await chatWithLibraryRAGAI({
        query: query.trim(),
        relevantChunks,
        conversationHistory: history,
        preferredLanguage,
      });

      const userMsg: LibraryMessage = {
        id: `msg_${Date.now()}_u`,
        role: 'user',
        content: query.trim(),
        timestamp: new Date().toISOString(),
      };

      const assistantMsg: LibraryMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: aiResult.answer,
        citations: aiResult.citations,
        timestamp: new Date().toISOString(),
      };

      conv.messages.push(userMsg, assistantMsg);
      conv.updatedAt = new Date().toISOString();
      writeDb(db);

      res.json({
        success: true,
        conversationId: conv.id,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      });
    } catch (err: any) {
      console.error('[Library Chat RAG Error]:', err);
      res.status(500).json({ error: 'RAG generation failed: ' + (err.message || 'Unknown error') });
    }
  });

  // =========================================================================
  // 2. HANDWRITTEN PROBLEM SOLVER ENDPOINTS
  // =========================================================================

  // Step 1: Image OCR & question extraction
  app.post('/api/handwritten/ocr', async (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { imageBase64, mimeType = 'image/jpeg', problemType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    try {
      const ocrResult = await ocrHandwrittenQuestionAI({
        imageBase64,
        mimeType,
        problemType,
      });

      res.json({ success: true, ...ocrResult });
    } catch (err: any) {
      console.error('[Handwritten OCR Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to recognize handwriting from image.' });
    }
  });

  // Step 2: Solve confirmed question step-by-step
  app.post('/api/handwritten/solve', async (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const {
      question,
      problemType = 'Mathematics',
      givenInfo,
      requiredInfo,
      imageBase64,
      mimeType,
      codeLanguage,
      subjectId,
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Confirmed question text is required.' });
    }

    try {
      const solution = await solveHandwrittenProblemAI({
        question: question.trim(),
        problemType,
        givenInfo,
        requiredInfo,
        imageBase64,
        mimeType,
        codeLanguage,
      });

      const solvedRecord: SolvedProblem = {
        id: `prob_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        subjectId,
        subjectName: solution.subjectName || problemType,
        problemType: solution.problemType,
        question: question.trim(),
        originalImageBase64: imageBase64 ? imageBase64.slice(0, 1000) : undefined, // Keep lightweight preview
        given: solution.given,
        required: solution.required,
        formula: solution.formula,
        steps: solution.steps,
        explanation: solution.explanation,
        finalAnswer: solution.finalAnswer,
        verification: solution.verification,
        diagramOrTruthTable: solution.diagramOrTruthTable,
        codeSolution: solution.codeSolution,
        solvedAt: new Date().toISOString(),
        savedToLibrary: true,
      };

      db.solvedProblems = db.solvedProblems || [];
      db.solvedProblems.unshift(solvedRecord);
      writeDb(db);

      res.json({ success: true, solution: solvedRecord });
    } catch (err: any) {
      console.error('[Handwritten Solver Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to solve handwritten problem.' });
    }
  });

  // Get saved solved problems
  app.get('/api/handwritten/saved', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const problems = (db.solvedProblems || []).filter((p) => p.userId === user.id);
    res.json({ success: true, problems });
  });

  // Delete saved problem
  app.delete('/api/handwritten/saved/:id', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    db.solvedProblems = (db.solvedProblems || []).filter(
      (p) => !(p.id === req.params.id && p.userId === user.id)
    );
    writeDb(db);
    res.json({ success: true, message: 'Saved problem deleted.' });
  });

  // =========================================================================
  // 3. PREVIOUS-YEAR PAPER INTELLIGENCE ENDPOINTS
  // =========================================================================

  // List user's uploaded previous year papers
  app.get('/api/pyq/papers', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const papers = (db.previousYearPapers || [])
      .filter((p) => p.userId === user.id)
      .map((p) => {
        let totalQ = 0;
        (p.sections || []).forEach((s) => (totalQ += s.questions?.length || 0));
        return {
          id: p.id,
          subjectName: p.subjectName,
          university: p.university,
          course: p.course,
          branch: p.branch,
          semester: p.semester,
          year: p.year,
          examType: p.examType,
          maxMarks: p.maxMarks,
          fileName: p.fileName,
          status: p.status,
          uploadedAt: p.uploadedAt,
          questionsCount: totalQ,
          sections: p.sections,
        };
      });

    res.json({ success: true, papers });
  });

  // Upload and parse previous year paper
  app.post('/api/pyq/papers/upload', async (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const {
      fileName,
      fileMimeType = 'application/pdf',
      base64Data,
      rawText,
      university = 'University Examination Board',
      course = 'B.Tech',
      branch = 'Computer Science',
      semester = '4th Semester',
      year = 2024,
      examType = 'End-Semester',
      maxMarks = 100,
      subjectName = 'Core Engineering',
      subjectId,
    } = req.body;

    if (!fileName || (!base64Data && !rawText)) {
      return res.status(400).json({ error: 'Paper file name and document data are required.' });
    }

    try {
      const parsedData = await extractPaperQuestionsAI({
        fileName,
        base64Data,
        mimeType: fileMimeType,
        rawText,
        university,
        year: Number(year),
        subjectName,
      });

      const paperRecord: PreviousYearPaper = {
        id: `pyp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        subjectId,
        subjectName: parsedData.subjectName || subjectName,
        university: parsedData.university || university,
        course,
        branch,
        semester,
        year: parsedData.year || Number(year) || 2024,
        examType,
        maxMarks: parsedData.maxMarks || Number(maxMarks) || 100,
        fileName,
        fileMimeType,
        status: 'ready',
        sections: parsedData.sections,
        uploadedAt: new Date().toISOString(),
      };

      db.previousYearPapers = db.previousYearPapers || [];
      db.previousYearPapers.unshift(paperRecord);
      writeDb(db);

      res.status(201).json({ success: true, paper: paperRecord });
    } catch (err: any) {
      console.error('[PYQ Paper Upload Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to extract paper questions.' });
    }
  });

  // Update paper metadata
  app.put('/api/pyq/papers/:id', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const paper = (db.previousYearPapers || []).find(
      (p) => p.id === req.params.id && p.userId === user.id
    );
    if (!paper) return res.status(404).json({ error: 'Paper not found.' });

    const { university, year, examType, maxMarks, subjectName } = req.body;
    if (university !== undefined) paper.university = university;
    if (year !== undefined) paper.year = Number(year);
    if (examType !== undefined) paper.examType = examType;
    if (maxMarks !== undefined) paper.maxMarks = Number(maxMarks);
    if (subjectName !== undefined) paper.subjectName = subjectName;

    writeDb(db);
    res.json({ success: true, paper });
  });

  // Delete paper
  app.delete('/api/pyq/papers/:id', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    db.previousYearPapers = (db.previousYearPapers || []).filter(
      (p) => !(p.id === req.params.id && p.userId === user.id)
    );
    writeDb(db);
    res.json({ success: true, message: 'Paper deleted.' });
  });

  // Multi-year comparative analytics
  app.post('/api/pyq/analyze', async (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { paperIds = [], subjectName, syllabusText } = req.body;

    const userPapers = (db.previousYearPapers || []).filter(
      (p) => p.userId === user.id && (paperIds.length === 0 || paperIds.includes(p.id))
    );

    if (userPapers.length === 0) {
      return res.status(400).json({ error: 'Please upload or select at least one previous year paper to analyze.' });
    }

    try {
      const flattenedPapers = userPapers.map((p) => {
        const questions: any[] = [];
        (p.sections || []).forEach((s) => {
          (s.questions || []).forEach((q) => questions.push(q));
        });
        return {
          year: p.year,
          university: p.university,
          questions,
        };
      });

      const reportData = await analyzePreviousYearPapersCollectionAI({
        subjectName: subjectName || userPapers[0]?.subjectName || 'Engineering Subject',
        papers: flattenedPapers,
        syllabusText,
      });

      const reportRecord: PaperAnalysisReport = {
        id: `pyq_rep_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        subjectId: req.body.subjectId || 'subj_pyq',
        subjectName: reportData.subjectName,
        analyzedAt: new Date().toISOString(),
        includedPaperIds: userPapers.map((p) => p.id),
        totalQuestionsAnalyzed: reportData.totalQuestionsAnalyzed,
        yearRange: reportData.yearRange,
        unitDistribution: reportData.unitDistribution,
        topicFrequencies: reportData.topicFrequencies,
        repeatedQuestions: reportData.repeatedQuestions,
        uncoveredSyllabusTopics: reportData.uncoveredSyllabusTopics,
        recommendedPriorities: reportData.recommendedPriorities,
        aiStudyPlan: reportData.aiStudyPlan,
      };

      db.paperAnalysisReports = db.paperAnalysisReports || [];
      db.paperAnalysisReports.unshift(reportRecord);
      writeDb(db);

      res.json({ success: true, report: reportRecord });
    } catch (err: any) {
      console.error('[PYQ Analyze Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to generate comparative analytics report.' });
    }
  });

  // Get past reports
  app.get('/api/pyq/reports', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const reports = (db.paperAnalysisReports || []).filter((r) => r.userId === user.id);
    res.json({ success: true, reports });
  });

  // =========================================================================
  // 4. OFFLINE PROGRESS SYNCHRONIZATION ENDPOINT
  // =========================================================================

  app.post('/api/sync/offline-progress', (req: Request, res: Response) => {
    const db = readDb();
    const user = getSessionUser(req, db);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ success: true, syncedCount: 0 });
    }

    db.offlineSyncRecords = db.offlineSyncRecords || [];
    let syncedCount = 0;

    items.forEach((item) => {
      // Idempotent duplicate check by item.id
      const exists = db.offlineSyncRecords.some((r) => r.id === item.id);
      if (!exists) {
        const record: OfflineSyncRecord = {
          id: item.id || `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: user.id,
          operationType: item.operationType || 'quiz_attempt',
          contentId: item.contentId || 'unknown',
          payload: item.payload || {},
          status: 'synced',
          syncedAt: new Date().toISOString(),
        };

        // Increment user XP / streak if offline quiz attempt
        if (item.operationType === 'quiz_attempt') {
          user.xp += 20;
          user.level = Math.max(1, Math.floor(user.xp / 100) + 1);
        }

        db.offlineSyncRecords.push(record);
        syncedCount++;
      }
    });

    writeDb(db);
    res.json({ success: true, syncedCount, totalReceived: items.length });
  });
}
