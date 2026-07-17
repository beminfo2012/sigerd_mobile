import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link', 'clean']
  ],
};

const formats = [
  'header', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'color', 'background', 'script',
  'align',
  'list', 'bullet',
  'indent',
  'link'
];

export default function RichTextEditor({ value, onChange, placeholder = 'Digite aqui...', className = '' }) {
  return (
    <div className={`rich-text-container flex flex-col ${className}`}>
      <style>{`
        .rich-text-container .quill {
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        .rich-text-container .ql-toolbar {
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
            background-color: #f8fafc;
            border-color: #e2e8f0;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        .rich-text-container .ql-container {
            resize: vertical;
            overflow-y: auto;
            min-height: 250px;
            max-height: 60vh;
            font-size: 14px;
            border-bottom-left-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
            border-color: #e2e8f0;
            background-color: #ffffff;
        }
        .dark .rich-text-container .ql-toolbar {
            background-color: #1e293b;
            border-color: #334155;
        }
        .dark .rich-text-container .ql-container {
            border-color: #334155;
            background-color: #0f172a;
        }
        .dark .rich-text-container .ql-editor.ql-blank::before {
            color: #64748b;
        }
        .rich-text-container .ql-editor {
            min-height: 100%;
        }
      `}</style>
      <ReactQuill 
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="text-slate-800 dark:text-slate-100"
      />
    </div>
  );
}
