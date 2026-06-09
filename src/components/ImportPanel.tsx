import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Download } from 'lucide-react';
import { useAnalysisStore } from '../store/useAnalysisStore';
import Papa from 'papaparse';

const buildCsvTemplate = () => {
  const today = new Date().toISOString().split('T')[0];
  return `树号,观测日期,支撑索张力千牛,倾斜角分
G001,${today},12.5,3.2
G002,${today},9.8,2.1`;
};

export function ImportPanel() {
  const { loading, importCSV } = useAnalysisStore();
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    importedCount: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setResult(null);
    const text = await file.text();
    try {
      const importResult = await importCSV(text);
      setResult(importResult);
    } catch (err) {
      setResult({
        success: false,
        importedCount: 0,
        errors: [err instanceof Error ? err.message : '导入失败'],
      });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      await handleFile(file);
    } else {
      setResult({
        success: false,
        importedCount: 0,
        errors: ['请上传CSV格式文件'],
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handlePreviewImport = async () => {
    try {
      const importResult = await importCSV(buildCsvTemplate());
      setResult(importResult);
    } catch (err) {
      setResult({
        success: false,
        importedCount: 0,
        errors: [err instanceof Error ? err.message : '导入失败'],
      });
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([buildCsvTemplate()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '观测数据导入模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parsePreview = (csvText: string) => {
    const result = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    return result.data.slice(0, 3);
  };

  const previewData = parsePreview(buildCsvTemplate());

  return (
    <div className="card animate-stagger" style={{ animationDelay: '0.9s' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-forest-100 rounded-lg">
          <Upload className="w-6 h-6 text-forest-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-forest-800 font-serif">
            数据导入
          </h2>
          <p className="text-sm text-gray-500">支持CSV格式批量导入观测数据</p>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-forest-500 bg-forest-50'
            : 'border-gray-300 hover:border-forest-400 hover:bg-forest-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center">
          <FileText
            className={`w-12 h-12 mb-3 ${
              isDragging ? 'text-forest-500' : 'text-gray-400'
            }`}
          />
          <p className="text-gray-700 font-medium mb-1">
            拖拽CSV文件到此处，或点击选择文件
          </p>
          <p className="text-sm text-gray-400">
            支持列名：树号、观测日期、支撑索张力千牛、倾斜角分
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={downloadTemplate}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          下载导入模板
        </button>
        <button
          onClick={handlePreviewImport}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Upload className="w-4 h-4" />
          导入示例数据
        </button>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-700 mb-3">CSV格式示例：</p>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2 pr-4">树号</th>
                <th className="pb-2 pr-4">观测日期</th>
                <th className="pb-2 pr-4">支撑索张力千牛</th>
                <th className="pb-2">倾斜角分</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 font-mono text-forest-700">
                    {row['树号'] || '-'}
                  </td>
                  <td className="py-2 pr-4 font-mono">
                    {row['观测日期'] || '-'}
                  </td>
                  <td className="py-2 pr-4 font-mono">
                    {row['支撑索张力千牛'] || '-'}
                  </td>
                  <td className="py-2 font-mono">{row['倾斜角分'] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result && (
        <div
          className={`mt-6 p-4 rounded-lg border-2 ${
            result.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.success
                  ? result.importedCount > 0
                    ? `导入成功！共导入 ${result.importedCount} 条记录`
                    : '处理完成'
                  : '导入失败'}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">问题详情：</p>
                  <ul className="text-sm space-y-1">
                    {result.errors.slice(0, 5).map((err, idx) => (
                      <li
                        key={idx}
                        className={result.success ? 'text-yellow-700' : 'text-red-700'}
                      >
                        • {err}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-gray-500">
                        ...还有 {result.errors.length - 5} 条问题
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
