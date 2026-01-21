
import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  title: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl my-6">
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <span className="text-slate-300 text-sm font-medium flex items-center gap-2">
          <i className="fa-solid fa-code text-blue-400"></i> {title}
        </span>
        <button 
          onClick={handleCopy}
          className="text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1 bg-slate-700 px-3 py-1.5 rounded-md"
        >
          {copied ? <><i className="fa-solid fa-check text-green-400"></i> Copied!</> : <><i className="fa-solid fa-copy"></i> Copy Code</>}
        </button>
      </div>
      <pre className="p-6 overflow-x-auto text-sm text-blue-50 font-mono leading-relaxed max-h-[500px]">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
