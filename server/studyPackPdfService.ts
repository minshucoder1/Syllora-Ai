import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subject, Note, Question, MCQ, Flashcard, CheatSheet, StudyRoadmap } from '../src/types';

export interface StudyPackServerData {
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

function sanitizeText(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
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
    .replace(/[^\x00-\x7F\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Builds the complete study pack PDF as a Buffer on the backend
 */
export function buildStudyPackPdfBuffer(
  data: StudyPackServerData,
  options: {
    selectedCategories?: string[];
    userName?: string;
    collegeName?: string;
  } = {}
): { buffer: Buffer; filename: string; pageCount: number } {
  const { subject } = data;
  const selectedCategories = options.selectedCategories || [
    'notes',
    'priority',
    'questions',
    'numericals',
    'mcqs',
    'flashcards',
    'mindmap',
    'cheatsheet',
    'mocktest',
    'viva',
    'studyplan',
  ];

  const subjectName = subject.name || 'Subject';
  const cleanSubjectFilename = subjectName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const filename = `${cleanSubjectFilename}_Complete_Study_Pack.pdf`;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 20;

  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 22;
      return true;
    }
    return false;
  };

  const addSectionHeader = (title: string, subtitle: string, badgeText: string) => {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text(badgeText.toUpperCase(), marginX, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(title, marginX, currentY);
    currentY += 6;

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, marginX, currentY);
      currentY += 5;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(marginX, currentY, marginX + contentWidth, currentY);
    currentY += 7;
  };

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

  // 1. COVER PAGE
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 55, 'F');
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 55, pageWidth, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(248, 113, 113);
  doc.text('SYLLORA AI  |  HIGH-YIELD EXAM PREPARATION', marginX, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  const splitTitle = doc.splitTextToSize(subjectName, contentWidth);
  doc.text(splitTitle, marginX, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text('Complete All-in-One Study Pack & Comprehensive Revision Guide', marginX, 48);

  currentY = 72;

  // Metadata Card
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

  doc.text(`Student: ${sanitizeText(options.userName || 'Student')}`, col1X, currentY + 16);
  doc.text(`Institution: ${sanitizeText(options.collegeName || subject.course || 'University')}`, col1X, currentY + 23);
  doc.text(`Course / Branch: ${sanitizeText(subject.course || 'B.Tech')} ${subject.code ? `(${subject.code})` : ''}`, col1X, currentY + 30);
  doc.text(`Total Units: ${subject.units?.length || 0} Units`, col1X, currentY + 37);

  doc.text(`Compiled On: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, col2X, currentY + 16);
  doc.text(`Exam Target Date: ${subject.examDate || 'Upcoming Semester Exam'}`, col2X, currentY + 23);
  doc.text(`Pack Coverage: ${selectedCategories.length} Categories Selected`, col2X, currentY + 30);
  doc.text(`Verification: AI-Synthesized & Exam-Aligned`, col2X, currentY + 37);

  currentY += 50;

  // Inventory Table
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
    styles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' }, 1: { cellWidth: 90 }, 2: { cellWidth: 30, halign: 'center' } },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 2. CATEGORY 1: SYLLABUS
  doc.addPage();
  currentY = 22;
  addSectionHeader('Subject Overview & Syllabus Breakdown', 'Curriculum structure, units distribution and examination weightages', 'Category 1 of 11');

  if (subject.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(sanitizeText(subject.description), contentWidth);
    doc.text(splitDesc, marginX, currentY);
    currentY += splitDesc.length * 4.5 + 6;
  }

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
      styles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 2.5 },
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
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

  // 3. CATEGORY 2: IMPORTANT TOPICS
  if (selectedCategories.includes('priority')) {
    ensureSpace(45);
    addSectionHeader('High-Yield Important Topics Index', 'Prioritized topics based on university question frequency & exam marks distribution', 'Category 2 of 11');
    const allTopics: any[] = [];
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
    allTopics.sort((a, b) => (a.priority.includes('Very') ? -1 : 1));

    if (allTopics.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Priority Yield', 'Unit', 'Topic Name', 'Exam Importance Rationale']],
        body: allTopics.map((t) => [t.priority, sanitizeText(t.unitName), sanitizeText(t.name), sanitizeText(t.reason)]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' }, 1: { cellWidth: 35 }, 2: { cellWidth: 45, fontStyle: 'bold' }, 3: { cellWidth: 70 } },
        margin: { left: marginX, right: marginX },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // 4. CATEGORY 3: NOTES
  if (selectedCategories.includes('notes')) {
    doc.addPage();
    currentY = 22;
    addSectionHeader('Unit-Wise Comprehensive Notes', 'In-depth theoretical explanations, definitions, key concepts and exam points', 'Category 3 of 11');
    const notes = data.notes || [];
    if (notes.length > 0) {
      notes.forEach((note, nIdx) => {
        ensureSpace(45);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(marginX, currentY, contentWidth, 10, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(185, 28, 28);
        doc.text(`Topic ${nIdx + 1}: ${sanitizeText(note.title)}`, marginX + 4, currentY + 7);
        currentY += 15;

        if (note.definition) {
          ensureSpace(16);
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

        if (note.explanation) {
          ensureSpace(18);
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

        if (note.examPoints && note.examPoints.length > 0) {
          ensureSpace(16);
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(marginX, currentY, contentWidth, 8 + note.examPoints.length * 4.5, 2, 2, 'F');
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

        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, currentY, marginX + contentWidth, currentY);
        currentY += 8;
      });
    } else {
      addEmptyNotice('Unit-Wise Notes', 'Generate topic notes inside the Notes tab to include them in this study pack.');
    }
  }

  // 5. CATEGORY 4: QUESTIONS
  if (selectedCategories.includes('questions')) {
    doc.addPage();
    currentY = 22;
    addSectionHeader('Important Questions & Model Answers', 'Curated 2-Mark, 5-Mark and 10-Mark questions with university marking schemes', 'Category 4 of 11');
    const questions = (data.questions || []).filter((q) => !q.isNumerical);
    if (questions.length > 0) {
      questions.forEach((q, qIdx) => {
        ensureSpace(35);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28);
        doc.text(`Question ${qIdx + 1}  [${q.marks || 5} MARKS]  [${sanitizeText(q.priority || 'Important')}]`, marginX, currentY);
        currentY += 4.5;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        const splitQ = doc.splitTextToSize(`Q: ${sanitizeText(q.question)}`, contentWidth);
        doc.text(splitQ, marginX, currentY);
        currentY += splitQ.length * 4.2 + 3;

        ensureSpace(18);
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

        doc.setDrawColor(241, 245, 249);
        doc.line(marginX, currentY, marginX + contentWidth, currentY);
        currentY += 6;
      });
    } else {
      addEmptyNotice('Important Questions', 'Generate questions inside the Important Questions module to include them.');
    }
  }

  // Running footers & headers
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`${sanitizeText(subjectName)}  •  Complete Study Pack  •  Syllora AI`, marginX, 10);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, 12, marginX + contentWidth, 12);

    doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);
    doc.text(`Page ${p} of ${totalPages}`, marginX, pageHeight - 8);
    doc.text('Generated by Syllora AI  •  Personal Study Guide', marginX + contentWidth, pageHeight - 8, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    filename,
    pageCount: totalPages,
  };
}
