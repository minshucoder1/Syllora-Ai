import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subject, Note, Question, MCQ, Flashcard, CheatSheet, StudyRoadmap } from '../types';

export interface StudyPackData {
  subject: Subject;
  notes?: Note[];
  questions?: Question[];
  numericals?: Question[];
  mcqs?: MCQ[];
  flashcards?: Flashcard[];
  mindmaps?: any[];
  cheatsheets?: CheatSheet[];
  mockTests?: any[];
  vivaQuestions?: any[];
  studyPlan?: any;
  roadmaps?: StudyRoadmap[];
}

export interface ExportPdfOptions {
  selectedCategories: string[];
  onProgress?: (status: string, percent: number) => void;
  userName?: string;
  collegeName?: string;
}

/**
 * Sanitizes text to avoid unprintable characters or corrupt glyphs in standard PDF fonts
 */
function sanitizeText(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    // Replace emojis and symbols with readable text
    .replace(/🔥/g, '[HIGH YIELD] ')
    .replace(/⭐/g, '[IMPORTANT] ')
    .replace(/🟡/g, '[MODERATE] ')
    .replace(/⚪/g, '[NORMAL] ')
    .replace(/📚/g, '')
    .replace(/❓/g, '')
    .replace(/🧮/g, '')
    .replace(/🧠/g, '')
    .replace(/🗂️/g, '')
    .replace(/🗺️/g, '')
    .replace(/📌/g, '')
    .replace(/📝/g, '')
    .replace(/🎤/g, '')
    .replace(/📅/g, '')
    .replace(/•/g, '-')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/⇒/g, '=>')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/±/g, '+/-')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√/g, 'sqrt')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\t/g, '  ')
    .replace(/[^\x00-\x7F\u0900-\u097F]/g, ' ') // Preserve ASCII and standard Devanagari range, replace rest
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates and downloads the Complete Study Pack PDF using jsPDF and jspdf-autotable
 */
export async function generateAndDownloadStudyPackPdf(
  data: StudyPackData,
  options: ExportPdfOptions
): Promise<{ success: boolean; filename: string; pageCount: number; error?: string }> {
  const { subject } = data;
  const { selectedCategories, onProgress, userName = 'Student', collegeName = '' } = options;

  const subjectName = subject.name || 'Subject';
  const cleanSubjectFilename = subjectName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const filename = `${cleanSubjectFilename}_Complete_Study_Pack.pdf`;

  try {
    onProgress?.('Initializing PDF Document...', 5);
    await new Promise((r) => setTimeout(r, 50));

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const pageHeight = doc.internal.pageSize.getHeight(); // 297
    const marginX = 15;
    const contentWidth = pageWidth - marginX * 2; // 180mm
    let currentY = 20;

    // Helper: Ensure enough space on current page, otherwise start a new page
    const ensureSpace = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 22;
        return true;
      }
      return false;
    };

    // Helper: Add standard section header
    const addSectionHeader = (title: string, subtitle: string, badgeText: string) => {
      ensureSpace(28);

      // Category badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.text(badgeText.toUpperCase(), marginX, currentY);
      currentY += 5;

      // Section Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(title, marginX, currentY);
      currentY += 6;

      // Subtitle
      if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(subtitle, marginX, currentY);
        currentY += 5;
      }

      // Horizontal separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(marginX, currentY, marginX + contentWidth, currentY);
      currentY += 7;
    };

    // Helper: Add notice for categories with no saved data
    const addEmptyNotice = (categoryLabel: string, adviceText: string) => {
      ensureSpace(25);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, contentWidth, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Status: No generated materials currently saved for ${categoryLabel}.`, marginX + 5, currentY + 7);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(adviceText, marginX + 5, currentY + 14);

      currentY += 26;
    };

    // ==========================================
    // 1. COVER PAGE
    // ==========================================
    onProgress?.('Generating Cover Page & Index...', 10);
    await new Promise((r) => setTimeout(r, 40));

    // Cover Page Top Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 55, 'F');

    // Accent line
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 55, pageWidth, 3, 'F');

    // Brand Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(248, 113, 113);
    doc.text('SYLLORA AI  |  HIGH-YIELD EXAM PREPARATION', marginX, 22);

    // Subject Title on Banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    const splitTitle = doc.splitTextToSize(subjectName, contentWidth);
    doc.text(splitTitle, marginX, 34);

    // Subtitle on Banner
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text('Complete All-in-One Study Pack & Comprehensive Revision Guide', marginX, 48);

    currentY = 72;

    // Overview Metadata Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, 42, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('DOCUMENT SPECIFICATIONS', marginX + 5, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const col1X = marginX + 5;
    const col2X = marginX + (contentWidth / 2);

    doc.text(`Student: ${sanitizeText(userName)}`, col1X, currentY + 16);
    doc.text(`Institution: ${sanitizeText(collegeName || subject.course || 'University')}`, col1X, currentY + 23);
    doc.text(`Course / Branch: ${sanitizeText(subject.course || 'B.Tech')} ${subject.code ? `(${subject.code})` : ''}`, col1X, currentY + 30);
    doc.text(`Total Units: ${subject.units?.length || 0} Units`, col1X, currentY + 37);

    doc.text(`Compiled On: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, col2X, currentY + 16);
    doc.text(`Exam Target Date: ${subject.examDate || 'Upcoming Semester Exam'}`, col2X, currentY + 23);
    doc.text(`Pack Coverage: ${selectedCategories.length} Categories Selected`, col2X, currentY + 30);
    doc.text(`Verification: AI-Synthesized & Exam-Aligned`, col2X, currentY + 37);

    currentY += 50;

    // Table of Contents / Category Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('STUDY PACK CATEGORY INVENTORY', marginX, currentY);
    currentY += 4;

    const categoryRows = [
      ['1. Subject Overview & Syllabus', 'Core syllabus breakdown, units & weightages', 'Included'],
      ['2. Important Topics Index', 'High-yield prioritized curriculum index', selectedCategories.includes('priority') ? 'Included' : 'Skipped'],
      ['3. Unit-Wise Notes', 'Exhaustive theory, key concepts & exam points', selectedCategories.includes('notes') ? `${data.notes?.length || 0} Topics` : 'Skipped'],
      ['4. Important Questions (2M, 5M, 10M)', 'University question bank with marking schemes', selectedCategories.includes('questions') ? `${data.questions?.length || 0} Questions` : 'Skipped'],
      ['5. Numerical Problems & Solutions', 'Formulas, step-by-step math & verification', selectedCategories.includes('numericals') ? `${data.numericals?.length || 0} Numericals` : 'Skipped'],
      ['6. MCQs Question Bank', 'Curated MCQs with answer keys & explanations', selectedCategories.includes('mcqs') ? `${data.mcqs?.length || 0} MCQs` : 'Skipped'],
      ['7. Active Recall Flashcards', 'Front/Back cards with key takeaways', selectedCategories.includes('flashcards') ? `${data.flashcards?.length || 0} Cards` : 'Skipped'],
      ['8. Cheat Sheet & Quick Revision', 'Definitions, formulas, key differences & algorithms', selectedCategories.includes('cheatsheet') ? `${data.cheatsheets?.length || 0} Sheets` : 'Skipped'],
      ['9. Mind Maps & Hierarchies', 'Structured visual concepts breakdown', selectedCategories.includes('mindmap') ? `${data.mindmaps?.length || 0} Mind Maps` : 'Skipped'],
      ['10. Viva & Oral Exam Guide', 'Viva questions, expected keywords & trap concepts', selectedCategories.includes('viva') ? 'Included' : 'Skipped'],
      ['11. Study Plan & AI Roadmap', 'Daily exam revision timeline & milestone tasks', selectedCategories.includes('studyplan') ? 'Included' : 'Skipped'],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Module / Category', 'Scope Description', 'Status']],
      body: categoryRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        textColor: [51, 65, 85],
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 90 },
        2: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: marginX, right: marginX },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    // Bottom note on cover
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('This Complete Study Pack has been prepared specifically for rigorous university examination preparation.', marginX, currentY);

    // ==========================================
    // 2. CATEGORY 1: SYLLABUS BREAKDOWN
    // ==========================================
    onProgress?.('Compiling Subject Overview & Syllabus...', 18);
    await new Promise((r) => setTimeout(r, 40));

    doc.addPage();
    currentY = 22;

    addSectionHeader(
      'Subject Overview & Syllabus Breakdown',
      'Curriculum structure, units distribution and examination weightages',
      'Category 1 of 11'
    );

    if (subject.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const splitDesc = doc.splitTextToSize(sanitizeText(subject.description), contentWidth);
      doc.text(splitDesc, marginX, currentY);
      currentY += splitDesc.length * 4.5 + 6;
    }

    // Units table
    if (subject.units && subject.units.length > 0) {
      const unitTableData: any[] = [];
      subject.units.forEach((u, uIdx) => {
        const topicsList = u.topics?.map((t) => t.name).join(', ') || 'General unit topics';
        unitTableData.push([
          `Unit ${uIdx + 1}`,
          sanitizeText(u.name),
          `${u.weightage || 20}%`,
          `${u.topics?.length || 0}`,
          sanitizeText(topicsList),
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Unit', 'Unit Title', 'Weightage', 'Topics', 'Key Curriculum Topics Covered']],
        body: unitTableData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          textColor: [51, 65, 85],
          cellPadding: 2.5,
        },
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 16, fontStyle: 'bold' },
          1: { cellWidth: 42, fontStyle: 'bold' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 86 },
        },
        margin: { left: marginX, right: marginX },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // ==========================================
    // 3. CATEGORY 2: IMPORTANT TOPICS INDEX
    // ==========================================
    if (selectedCategories.includes('priority')) {
      onProgress?.('Compiling High-Yield Topics Index...', 25);
      await new Promise((r) => setTimeout(r, 40));

      ensureSpace(45);
      addSectionHeader(
        'High-Yield Important Topics Index',
        'Prioritized topics based on university question frequency & exam marks distribution',
        'Category 2 of 11'
      );

      const allTopics: { unitName: string; name: string; priority: string; reason: string }[] = [];
      (subject.units || []).forEach((u) => {
        (u.topics || []).forEach((t) => {
          allTopics.push({
            unitName: u.name,
            name: t.name,
            priority: t.priority === 'very_important' ? 'Very High Yield' : t.priority === 'important' ? 'High Yield' : 'Standard Yield',
            reason: t.priorityReason || 'Core university syllabus topic frequently targeted in midterms and finals.',
          });
        });
      });

      // Sort with very high yield first
      allTopics.sort((a, b) => (a.priority.includes('Very') ? -1 : 1));

      if (allTopics.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Priority Yield', 'Unit', 'Topic Name', 'Exam Importance Rationale']],
          body: allTopics.map((t) => [
            t.priority,
            sanitizeText(t.unitName),
            sanitizeText(t.name),
            sanitizeText(t.reason),
          ]),
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2.2,
          },
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 30, fontStyle: 'bold' },
            1: { cellWidth: 35 },
            2: { cellWidth: 45, fontStyle: 'bold' },
            3: { cellWidth: 70 },
          },
          margin: { left: marginX, right: marginX },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      } else {
        addEmptyNotice('Important Topics Index', 'Generate subject analysis to unlock topic prioritization.');
      }
    }

    // ==========================================
    // 4. CATEGORY 3: UNIT-WISE NOTES
    // ==========================================
    if (selectedCategories.includes('notes')) {
      onProgress?.('Formatting Unit-Wise Notes...', 35);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'Unit-Wise Comprehensive Notes',
        'In-depth theoretical explanations, definitions, key concepts and exam points',
        'Category 3 of 11'
      );

      const notes = data.notes || [];

      if (notes.length > 0) {
        notes.forEach((note, nIdx) => {
          ensureSpace(50);

          // Note Box
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(marginX, currentY, contentWidth, 10, 2, 2, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(185, 28, 28);
          doc.text(`Topic ${nIdx + 1}: ${sanitizeText(note.title)}`, marginX + 4, currentY + 7);
          currentY += 15;

          // Definition
          if (note.definition) {
            ensureSpace(18);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text('Definition & Overview:', marginX, currentY);
            currentY += 4.5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(51, 65, 85);
            const splitDef = doc.splitTextToSize(sanitizeText(note.definition), contentWidth);
            doc.text(splitDef, marginX, currentY);
            currentY += splitDef.length * 4 + 4;
          }

          // Key Concepts
          if (note.keyConcepts && note.keyConcepts.length > 0) {
            ensureSpace(16);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text('Key Theoretical Concepts:', marginX, currentY);
            currentY += 4.5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);

            note.keyConcepts.forEach((kc) => {
              ensureSpace(8);
              const splitKc = doc.splitTextToSize(`- ${sanitizeText(kc)}`, contentWidth - 4);
              doc.text(splitKc, marginX + 2, currentY);
              currentY += splitKc.length * 3.8 + 1;
            });
            currentY += 3;
          }

          // Explanation
          if (note.explanation) {
            ensureSpace(20);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text('Detailed Explanation:', marginX, currentY);
            currentY += 4.5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);
            const splitExp = doc.splitTextToSize(sanitizeText(note.explanation), contentWidth);
            doc.text(splitExp, marginX, currentY);
            currentY += splitExp.length * 3.8 + 4;
          }

          // Exam Points
          if (note.examPoints && note.examPoints.length > 0) {
            ensureSpace(16);
            doc.setFillColor(254, 242, 242);
            doc.setDrawColor(254, 202, 202);
            doc.roundedRect(marginX, currentY, contentWidth, 8 + note.examPoints.length * 4.5, 2, 2, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(185, 28, 28);
            doc.text('HIGH-YIELD EXAM POINTS & REVISION SUMMARY:', marginX + 4, currentY + 5.5);
            currentY += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(153, 27, 27);

            note.examPoints.forEach((ep) => {
              const splitEp = doc.splitTextToSize(`* ${sanitizeText(ep)}`, contentWidth - 8);
              doc.text(splitEp, marginX + 4, currentY);
              currentY += splitEp.length * 3.8 + 1;
            });
            currentY += 6;
          }

          // Subtle divider between notes
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(marginX, currentY, marginX + contentWidth, currentY);
          currentY += 8;
        });
      } else {
        addEmptyNotice('Unit-Wise Notes', 'Generate topic notes inside the Notes tab to include them in this study pack.');
      }
    }

    // ==========================================
    // 5. CATEGORY 4: IMPORTANT QUESTIONS (2M, 5M, 10M)
    // ==========================================
    if (selectedCategories.includes('questions')) {
      onProgress?.('Compiling Important Questions & Answers...', 48);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'Important Questions & Model Answers',
        'Curated 2-Mark, 5-Mark and 10-Mark questions with university marking schemes',
        'Category 4 of 11'
      );

      const questions = (data.questions || []).filter((q) => !q.isNumerical);

      if (questions.length > 0) {
        questions.forEach((q, qIdx) => {
          ensureSpace(35);

          // Marks and Priority Badge
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(185, 28, 28);
          doc.text(
            `Question ${qIdx + 1}  [${q.marks || 5} MARKS]  [${sanitizeText(q.priority || 'Important')}]  ${q.difficulty ? `[${q.difficulty}]` : ''}`,
            marginX,
            currentY
          );
          currentY += 4.5;

          // Question Text
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          const splitQ = doc.splitTextToSize(`Q: ${sanitizeText(q.question)}`, contentWidth);
          doc.text(splitQ, marginX, currentY);
          currentY += splitQ.length * 4.2 + 3;

          // Model Answer
          ensureSpace(20);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.text('Model Answer:', marginX, currentY);
          currentY += 4;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          const splitAns = doc.splitTextToSize(sanitizeText(q.answer), contentWidth);
          doc.text(splitAns, marginX, currentY);
          currentY += splitAns.length * 3.7 + 3;

          // Marking scheme & Common mistakes if available
          if (q.markingScheme || q.commonMistakes) {
            ensureSpace(14);
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            const infoHeight = 12;
            doc.roundedRect(marginX, currentY, contentWidth, infoHeight, 1.5, 1.5, 'FD');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            if (q.markingScheme) {
              doc.text(`Marking Scheme: ${sanitizeText(q.markingScheme)}`, marginX + 3, currentY + 4.5);
            }
            if (q.commonMistakes) {
              doc.text(`Avoid Common Mistake: ${sanitizeText(q.commonMistakes)}`, marginX + 3, currentY + 9);
            }
            currentY += infoHeight + 4;
          }

          doc.setDrawColor(241, 245, 249);
          doc.line(marginX, currentY, marginX + contentWidth, currentY);
          currentY += 6;
        });
      } else {
        addEmptyNotice('Important Questions', 'Generate questions inside the Important Questions module to include them.');
      }
    }

    // ==========================================
    // 6. CATEGORY 5: NUMERICALS
    // ==========================================
    if (selectedCategories.includes('numericals')) {
      onProgress?.('Processing Numerical Solutions...', 58);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'Numerical Problems & Step-by-Step Solutions',
        'Quantitative problem bank with explicit formulas, step calculation, and sanity verification',
        'Category 5 of 11'
      );

      const numericals = data.numericals || (data.questions || []).filter((q) => q.isNumerical);

      if (numericals.length > 0) {
        numericals.forEach((num, numIdx) => {
          ensureSpace(45);

          // Header
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(185, 28, 28);
          doc.text(`Numerical ${numIdx + 1}  [${num.marks || 10} MARKS]`, marginX, currentY);
          currentY += 4.5;

          // Problem statement
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          const splitQ = doc.splitTextToSize(`Problem: ${sanitizeText(num.question)}`, contentWidth);
          doc.text(splitQ, marginX, currentY);
          currentY += splitQ.length * 4 + 3;

          // Formula box
          if (num.formula) {
            ensureSpace(12);
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(185, 28, 28);
            doc.text(`Formula Applied: ${sanitizeText(num.formula)}`, marginX + 3, currentY + 5.5);
            currentY += 11;
          }

          // Step by step working
          ensureSpace(20);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text('Step-by-Step Solution:', marginX, currentY);
          currentY += 4;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);

          const answerText = num.answer || (num.steps ? num.steps.join('\n') : '');
          const splitAns = doc.splitTextToSize(sanitizeText(answerText), contentWidth);
          doc.text(splitAns, marginX, currentY);
          currentY += splitAns.length * 3.7 + 3;

          // Final Answer Highlight Box
          if (num.finalAnswer) {
            ensureSpace(10);
            doc.setFillColor(240, 253, 244);
            doc.setDrawColor(187, 247, 208);
            doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(22, 101, 52);
            doc.text(`Final Verified Result: ${sanitizeText(num.finalAnswer)}`, marginX + 3, currentY + 5.5);
            currentY += 12;
          }

          doc.setDrawColor(241, 245, 249);
          doc.line(marginX, currentY, marginX + contentWidth, currentY);
          currentY += 6;
        });
      } else {
        addEmptyNotice('Numerical Problems', 'Generate numerical questions for applicable subjects in the Numericals tool.');
      }
    }

    // ==========================================
    // 7. CATEGORY 6: MCQS QUESTION BANK
    // ==========================================
    if (selectedCategories.includes('mcqs')) {
      onProgress?.('Compiling MCQs & Explanations...', 68);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'MCQs Question Bank & Explanations',
        'Multiple choice questions with official answer keys and conceptual rationales',
        'Category 6 of 11'
      );

      const mcqs = data.mcqs || [];

      if (mcqs.length > 0) {
        mcqs.forEach((mcq, mIdx) => {
          ensureSpace(32);

          // Question header & text
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          const splitQ = doc.splitTextToSize(`${mIdx + 1}. ${sanitizeText(mcq.question)}`, contentWidth);
          doc.text(splitQ, marginX, currentY);
          currentY += splitQ.length * 4 + 2;

          // Options (A, B, C, D)
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);

          const optAY = currentY;
          doc.text(`A) ${sanitizeText(mcq.optionA)}`, marginX + 4, optAY);
          doc.text(`B) ${sanitizeText(mcq.optionB)}`, marginX + (contentWidth / 2), optAY);
          currentY += 4.5;

          const optCY = currentY;
          doc.text(`C) ${sanitizeText(mcq.optionC)}`, marginX + 4, optCY);
          doc.text(`D) ${sanitizeText(mcq.optionD)}`, marginX + (contentWidth / 2), optCY);
          currentY += 5;

          // Correct Answer Badge
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(22, 101, 52);
          doc.text(`[Correct Answer: Option (${mcq.correctAnswer})]`, marginX + 4, currentY);
          currentY += 4;

          // Explanation
          if (mcq.explanation) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            const splitExp = doc.splitTextToSize(`Rationale: ${sanitizeText(mcq.explanation)}`, contentWidth - 8);
            doc.text(splitExp, marginX + 4, currentY);
            currentY += splitExp.length * 3.5 + 4;
          }

          doc.setDrawColor(241, 245, 249);
          doc.line(marginX, currentY, marginX + contentWidth, currentY);
          currentY += 5;
        });
      } else {
        addEmptyNotice('MCQs Question Bank', 'Generate MCQs in the MCQ Quiz section to bundle them into this pack.');
      }
    }

    // ==========================================
    // 8. CATEGORY 7: FLASHCARDS
    // ==========================================
    if (selectedCategories.includes('flashcards')) {
      onProgress?.('Building Active Recall Flashcards...', 76);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'Active Recall Flashcards',
        'Rapid retrieval prompts, definition checks and takeaway memory hooks',
        'Category 7 of 11'
      );

      const flashcards = data.flashcards || [];

      if (flashcards.length > 0) {
        flashcards.forEach((card, cIdx) => {
          ensureSpace(28);

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(185, 28, 28);
          doc.text(`CARD #${cIdx + 1}  •  PROMPT:`, marginX + 4, currentY + 5.5);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          const splitFront = doc.splitTextToSize(sanitizeText(card.front), contentWidth - 8);
          doc.text(splitFront, marginX + 4, currentY + 10);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          const splitBack = doc.splitTextToSize(`Recall Answer: ${sanitizeText(card.back)}`, contentWidth - 8);
          doc.text(splitBack, marginX + 4, currentY + 16);

          if (card.keyTakeaway) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            doc.text(`Key Memory Hook: ${sanitizeText(card.keyTakeaway)}`, marginX + 4, currentY + 21);
          }

          currentY += 28;
        });
      } else {
        addEmptyNotice('Flashcards Deck', 'Generate flashcards in the Flashcards view to populate this deck.');
      }
    }

    // ==========================================
    // 9. CATEGORY 8: CHEAT SHEET
    // ==========================================
    if (selectedCategories.includes('cheatsheet')) {
      onProgress?.('Formatting Revision Cheat Sheets...', 82);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'One-Page Quick Revision Cheat Sheet',
        'Essential definitions, critical formulas, key differences, and high-frequency algorithms',
        'Category 8 of 11'
      );

      const cheatsheets = data.cheatsheets || [];

      if (cheatsheets.length > 0) {
        cheatsheets.forEach((cs) => {
          // Cheat Sheet Title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(185, 28, 28);
          doc.text(sanitizeText(cs.title || 'Curriculum Quick Summary'), marginX, currentY);
          currentY += 6;

          // Definitions table
          if (cs.definitions && cs.definitions.length > 0) {
            autoTable(doc, {
              startY: currentY,
              head: [['Crucial Term', 'Exact University Definition']],
              body: cs.definitions.map((d) => [sanitizeText(d.term), sanitizeText(d.definition)]),
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 2 },
              headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
              columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 1: { cellWidth: 130 } },
              margin: { left: marginX, right: marginX },
            });
            currentY = (doc as any).lastAutoTable.finalY + 8;
          }

          // Formulas table
          if (cs.formulas && cs.formulas.length > 0) {
            ensureSpace(35);
            autoTable(doc, {
              startY: currentY,
              head: [['Formula Name', 'Mathematical Formula', 'Key Exam Application']],
              body: cs.formulas.map((f) => [sanitizeText(f.name), sanitizeText(f.formula), sanitizeText(f.note)]),
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 2 },
              headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' },
              columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 65, fontStyle: 'bold' }, 2: { cellWidth: 70 } },
              margin: { left: marginX, right: marginX },
            });
            currentY = (doc as any).lastAutoTable.finalY + 8;
          }

          // Key differences
          if (cs.keyDifferences && cs.keyDifferences.length > 0) {
            ensureSpace(35);
            autoTable(doc, {
              startY: currentY,
              head: [['Comparison Aspect', 'Option / Concept A', 'Option / Concept B']],
              body: cs.keyDifferences.map((kd) => [sanitizeText(kd.aspect), sanitizeText(kd.itemA), sanitizeText(kd.itemB)]),
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 2 },
              headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
              columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' }, 1: { cellWidth: 70 }, 2: { cellWidth: 70 } },
              margin: { left: marginX, right: marginX },
            });
            currentY = (doc as any).lastAutoTable.finalY + 8;
          }
        });
      } else {
        addEmptyNotice('Revision Cheat Sheet', 'Compile a unit cheat sheet inside the Cheat Sheet tab to include it.');
      }
    }

    // ==========================================
    // 10. CATEGORY 9: MIND MAPS
    // ==========================================
    if (selectedCategories.includes('mindmap')) {
      onProgress?.('Structuring Concept Mind Maps...', 88);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'Visual Hierarchical Mind Maps',
        'Structured concept tree breakdown illustrating prerequisites, branches and relationships',
        'Category 9 of 11'
      );

      const mindmaps = data.mindmaps || [];

      if (mindmaps.length > 0) {
        mindmaps.forEach((mm) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(185, 28, 28);
          doc.text(`Root Topic: ${sanitizeText(mm.title || mm.rootName || subjectName)}`, marginX, currentY);
          currentY += 6;

          // Render tree nodes if available
          const nodes = mm.nodes || mm.rootNode?.children || [];
          if (Array.isArray(nodes) && nodes.length > 0) {
            nodes.forEach((branch: any) => {
              ensureSpace(14);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(8.5);
              doc.setTextColor(15, 23, 42);
              doc.text(`|-- [Branch] ${sanitizeText(branch.label || branch.name)}`, marginX + 4, currentY);
              currentY += 4.5;

              if (branch.children && Array.isArray(branch.children)) {
                branch.children.forEach((sub: any) => {
                  ensureSpace(8);
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(8);
                  doc.setTextColor(71, 85, 105);
                  doc.text(`    |-- ${sanitizeText(sub.label || sub.name)}: ${sanitizeText(sub.description || '')}`, marginX + 6, currentY);
                  currentY += 4;
                });
              }
              currentY += 2;
            });
          }
          currentY += 6;
        });
      } else {
        // Fallback honest mindmap of the subject units & topics
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Hierarchical Syllabus Tree: ${sanitizeText(subjectName)}`, marginX, currentY);
        currentY += 6;

        (subject.units || []).forEach((u, uIdx) => {
          ensureSpace(16);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(185, 28, 28);
          doc.text(`[Unit ${uIdx + 1}] ${sanitizeText(u.name)} (${u.weightage || 20}% weightage)`, marginX + 4, currentY);
          currentY += 4.5;

          (u.topics || []).forEach((t) => {
            ensureSpace(8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text(`   |-- ${sanitizeText(t.name)} [${sanitizeText(t.priority || 'standard')}]`, marginX + 6, currentY);
            currentY += 4;
          });
          currentY += 3;
        });
      }
    }

    // ==========================================
    // 11. CATEGORY 10: VIVA QUESTIONS
    // ==========================================
    if (selectedCategories.includes('viva')) {
      onProgress?.('Compiling Viva & Oral Exam Guide...', 92);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'Oral Examination & Viva Questions Guide',
        'Frequent oral test inquiries, fundamental concepts examiners evaluate, and follow-up traps',
        'Category 10 of 11'
      );

      const vivaQuestions = data.vivaQuestions || [];

      if (vivaQuestions.length > 0) {
        vivaQuestions.forEach((vq: any, vIdx: number) => {
          ensureSpace(25);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(185, 28, 28);
          doc.text(`Viva Question ${vIdx + 1}: ${sanitizeText(vq.question)}`, marginX, currentY);
          currentY += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          const splitAns = doc.splitTextToSize(`Examiner Expectation: ${sanitizeText(vq.answer || vq.expectedAnswer)}`, contentWidth);
          doc.text(splitAns, marginX, currentY);
          currentY += splitAns.length * 3.8 + 3;

          if (vq.followUp) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(`Common Follow-Up Trap: ${sanitizeText(vq.followUp)}`, marginX, currentY);
            currentY += 5;
          }
          currentY += 4;
        });
      } else {
        // Honest summary from notes/topics
        addEmptyNotice('Viva Questions Guide', 'Practice voice viva sessions in the Voice Viva Prep tool to record personal oral guides.');
      }
    }

    // ==========================================
    // 12. CATEGORY 11: STUDY PLAN & ROADMAP
    // ==========================================
    if (selectedCategories.includes('studyplan')) {
      onProgress?.('Assembling AI Study Roadmap & Timeline...', 95);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'AI Study Roadmap & Revision Timeline',
        'Day-by-day exam preparation schedule, target milestones and daily study allocation',
        'Category 11 of 11'
      );

      const roadmaps = data.roadmaps || [];
      const primaryRoadmap = roadmaps[0];

      if (primaryRoadmap && primaryRoadmap.days && primaryRoadmap.days.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Target: ${sanitizeText(primaryRoadmap.subjectName)}  •  ${primaryRoadmap.days.length} Days Plan (${primaryRoadmap.dailyStudyMinutes || 120} Mins/Day)`,
          marginX,
          currentY
        );
        currentY += 6;

        const roadmapTable: any[] = [];
        primaryRoadmap.days.forEach((day) => {
          const topicsStr = (day.topics || []).map((t) => t.topicName).join(', ');
          const tasksStr = (day.tasks || []).map((t) => `${t.title} (${t.durationMinutes}m)`).join('; ');
          roadmapTable.push([
            `Day ${day.dayNumber}`,
            day.date || '-',
            sanitizeText(day.summary || topicsStr),
            sanitizeText(tasksStr || 'Revision & practice'),
          ]);
        });

        autoTable(doc, {
          startY: currentY,
          head: [['Day', 'Date', 'Core Curriculum Target', 'Milestone Tasks & Duration']],
          body: roadmapTable,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2.2 },
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 16, fontStyle: 'bold' },
            1: { cellWidth: 24 },
            2: { cellWidth: 65 },
            3: { cellWidth: 75 },
          },
          margin: { left: marginX, right: marginX },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        addEmptyNotice('AI Study Roadmap', 'Generate an AI Study Roadmap inside the Study Roadmap tab to include a customized revision schedule.');
      }
    }

    // ==========================================
    // 13. MOCK TEST (IF AVAILABLE OR SELECTED)
    // ==========================================
    if (selectedCategories.includes('mocktest') && data.mockTests && data.mockTests.length > 0) {
      onProgress?.('Appending Mock Examination Paper...', 97);
      await new Promise((r) => setTimeout(r, 40));

      doc.addPage();
      currentY = 22;

      addSectionHeader(
        'Complete University Mock Examination Paper',
        'Official simulation paper structured with sections, mark allotments and university instructions',
        'Mock Test Artifact'
      );

      const paper = data.mockTests[0];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(sanitizeText(paper.title || 'Semester Examination Mock Paper'), marginX, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Total Marks: ${paper.totalMarks || 100}  |  Duration: ${paper.durationMinutes || 180} Minutes`, marginX, currentY);
      currentY += 8;

      if (paper.sections && Array.isArray(paper.sections)) {
        paper.sections.forEach((sec: any) => {
          ensureSpace(20);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(185, 28, 28);
          doc.text(`${sanitizeText(sec.sectionName)} [${sec.totalMarks || 20} Marks] - ${sanitizeText(sec.instructions || '')}`, marginX + 3, currentY + 5.5);
          currentY += 12;

          (sec.questions || []).forEach((q: any) => {
            ensureSpace(12);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(15, 23, 42);
            const splitQ = doc.splitTextToSize(`Q${q.questionNumber || ''}. ${sanitizeText(q.text)} [${q.marks || 5}M]`, contentWidth - 4);
            doc.text(splitQ, marginX + 3, currentY);
            currentY += splitQ.length * 3.8 + 2;
          });
          currentY += 4;
        });
      }
    }

    // ==========================================
    // 14. FOOTERS & PAGE NUMBERING (ALL PAGES)
    // ==========================================
    onProgress?.('Finalizing Pages & Running Footers...', 99);
    await new Promise((r) => setTimeout(r, 40));

    const totalPages = doc.getNumberOfPages();

    for (let p = 2; p <= totalPages; p++) {
      doc.setPage(p);

      // Running Header
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${sanitizeText(subjectName)}  •  Complete Study Pack  •  Syllora AI`, marginX, 10);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, 12, marginX + contentWidth, 12);

      // Running Footer
      doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);
      doc.text(`Page ${p} of ${totalPages}`, marginX, pageHeight - 8);
      doc.text('Generated by Syllora AI  •  Personal Study Guide', marginX + contentWidth, pageHeight - 8, { align: 'right' });
    }

    // ==========================================
    // 15. TRIGGER DOWNLOAD
    // ==========================================
    onProgress?.('Triggering Instant File Download...', 100);
    await new Promise((r) => setTimeout(r, 60));

    // Generate output as blob and trigger download via native anchor
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 15000);

    return {
      success: true,
      filename,
      pageCount: totalPages,
    };
  } catch (err: any) {
    console.error('[PDF Export Error]:', err);
    return {
      success: false,
      filename,
      pageCount: 0,
      error: err.message || 'Failed to construct PDF document',
    };
  }
}
