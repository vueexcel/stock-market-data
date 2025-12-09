import React, { useState, useEffect, useRef } from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, LineChart, ChevronDown, BarChart3, Loader2 } from 'lucide-react';
import tickersData from '../data/all_tickers.json';
import { BASE_URL } from '../utils/api';
import axios from 'axios';
import DatePicker from '../components/DatePicker';

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2 text-left bg-white border border-slate-300 rounded-md shadow-sm flex justify-between items-center ${disabled
            ? 'bg-slate-50 cursor-not-allowed'
            : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
          }`}
        disabled={disabled}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-2 border border-slate-300 rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-indigo-500 hover:text-white cursor-pointer"
                >
                  {option}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-slate-500">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

interface PerformanceRow {
  period: string;
  startDate: string;
  endDate: string;
  years: number;
  startPrice: number;
  endPrice: number;
  priceDifference: number;
  totalReturn: number;
  simpleAnnualReturn: number;
  cagrPercent: number;
}

interface PerformanceGroups {
  dynamicPeriods: PerformanceRow[];
  predefinedPeriods: PerformanceRow[];
  annualReturns: PerformanceRow[];
  customRange?: PerformanceRow[];
  //  ms. additional groups can be added here
  quarterlyReturns?: PerformanceRow[];
  monthlyReturns?: PerformanceRow[];
}
const chartData = [
  { name: '18 Oct', 'Credit Debit Card': 20000, 'Bank Amount': 41000 },
  { name: '21 Oct', 'Credit Debit Card': 42000, 'Bank Amount': 43000 },
  { name: '25 Oct', 'Credit Debit Card': 33000, 'Bank Amount': 59000 },
  { name: '28 Oct', 'Credit Debit Card': 48000, 'Bank Amount': 45000 },
  { name: '2 Nov', 'Credit Debit Card': 51000, 'Bank Amount': 40000 },
  { name: '5 Nov', 'Credit Debit Card': 68000, 'Bank Amount': 32000 },
  { name: '9 Nov', 'Credit Debit Card': 55000, 'Bank Amount': 20000 },
  { name: '12 Nov', 'Credit Debit Card': 53000, 'Bank Amount': 38000 },
];

const AnalyticsData = () => {
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [performanceData, setPerformanceData] = useState<PerformanceGroups | null>(null);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    setTickers(tickersData.tickers);
  }, []);

  const fetchPerformanceData = async (ticker: string) => {
    if (!ticker) return;

    setIsLoading(true);
    setPerformanceData(null);

    try {
      const response = await axios.post(`${BASE_URL}/analytics_performance`, { ticker });
      setPerformanceData(response?.data?.performance || {});
    } catch (error) {
      console.error('❌ Failed to fetch performance data:', error);
      setPerformanceData({ dynamicPeriods: [], predefinedPeriods: [], annualReturns: [], customRange: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCustomPeriod = async () => {
    if (!selectedTicker || !customStartDate || !customEndDate) return;
    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/analytics_performance`, {
        ticker: selectedTicker,
        customStartDate,
        customEndDate,
      });
      setPerformanceData(response?.data?.performance || {});
    } catch (error) {
      console.error('❌ Failed to fetch custom period:', error);
      setPerformanceData(prev => prev ? { ...prev, customRange: [] } : { dynamicPeriods: [], predefinedPeriods: [], annualReturns: [], customRange: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTickerChange = (ticker: string) => {
    setSelectedTicker(ticker);
    fetchPerformanceData(ticker);
  };
  // const renderTable = (title: string, data: PerformanceRow[]) => (
  //   <div key={title} className="border border-slate-200 rounded-lg overflow-hidden">
  //     <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-200">
  //       <TrendingUp className="h-5 w-5 text-indigo-600" />
  //       <h3 className="text-md font-semibold text-slate-800">{title}</h3>
  //     </div>
  //     {data && data.length > 0 ? (
  //       <div className="overflow-x-auto">
  //         <table className="w-full">
  //           <thead className="bg-slate-50">
  //             <tr>
  //               <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Period</th>
  //               <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Start Date</th>
  //               <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">End Date</th>
  //               <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Years</th>
  //               <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Start Price</th>
  //               <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">End Price</th>
  //               <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Price Diff</th>
  //               <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Total Return (%)</th>
  //               <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Simple Annual (%)</th>
  //               <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">CAGR (%)</th>
  //             </tr>
  //           </thead>
  //           <tbody className="divide-y divide-slate-200">
  //             {data.map((row) => (
  //               <tr key={row.period} className="hover:bg-slate-50">
  //                 <td className="p-4 text-sm font-semibold text-slate-900">{row.period}</td>
  //                 <td className="p-4 text-sm text-slate-600">{row.startDate}</td>
  //                 <td className="p-4 text-sm text-slate-600">{row.endDate}</td>
  //                 <td className="p-4 text-sm text-right text-slate-600 font-mono">{row.years?.toFixed(1)}</td>
  //                 <td className="p-4 text-sm text-right text-slate-600 font-mono">{row.startPrice?.toLocaleString()}</td>
  //                 <td className="p-4 text-sm text-right text-slate-600 font-mono">{row.endPrice?.toLocaleString()}</td>
  //                 <td
  //                   className={`p-4 text-sm text-right font-mono ${row.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'
  //                     }`}
  //                 >
  //                   {row.priceDifference?.toLocaleString()}
  //                 </td>
  //                 <td
  //                   className={`p-4 text-sm text-right font-semibold ${row.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
  //                     }`}
  //                 >
  //                   {row.totalReturn?.toFixed(2)}%
  //                 </td>
  //                 <td className="p-4 text-sm text-right font-mono text-blue-600">
  //                   {row.simpleAnnualReturn?.toFixed(2)}%
  //                 </td>
  //                 <td className="p-4 text-sm text-right font-mono text-indigo-600">
  //                   {row.cagrPercent?.toFixed(2)}%
  //                 </td>
  //               </tr>
  //             ))}
  //           </tbody>
  //         </table>
  //       </div>
  //     ) : (
  //       <div className="p-4 text-sm text-center text-slate-500">
  //         No data available for this section.
  //       </div>
  //     )}
  //   </div>
  // );

const renderTable = (title: string, data: PerformanceRow[]) => {
  // Sort descending by endDate (newest first)
  const sortedData = [...data].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  return (
    <div key={title} className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-200">
        <TrendingUp className="h-5 w-5 text-indigo-600" />
        <h3 className="text-md font-semibold text-slate-800">{title}</h3>
      </div>
      {sortedData && sortedData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Period</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Start Date</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">End Date</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Years</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Start Price</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">End Price</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Price Diff</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Total Return (%)</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Simple Annual (%)</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">CAGR (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedData.map((row) => (
                <tr key={row.period} className="hover:bg-slate-50">
                  <td className="p-4 text-sm font-semibold text-slate-900">{row.period}</td>
                  <td className="p-4 text-sm text-slate-600">{row.startDate}</td>
                  <td className="p-4 text-sm text-slate-600">{row.endDate}</td>
                  <td className="p-4 text-sm text-right text-slate-600 font-mono">{row.years?.toFixed(1)}</td>
                  <td className="p-4 text-sm text-right text-slate-600 font-mono">{row.startPrice?.toLocaleString()}</td>
                  <td className="p-4 text-sm text-right text-slate-600 font-mono">{row.endPrice?.toLocaleString()}</td>
                  <td
                    className={`p-4 text-sm text-right font-mono ${row.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    {row.priceDifference?.toLocaleString()}
                  </td>
                  <td
                    className={`p-4 text-sm text-right font-semibold ${row.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    {row.totalReturn?.toFixed(2)}%
                  </td>
                  <td className="p-4 text-sm text-right font-mono text-blue-600">
                    {row.simpleAnnualReturn?.toFixed(2)}%
                  </td>
                  <td className="p-4 text-sm text-right font-mono text-indigo-600">
                    {row.cagrPercent?.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 text-sm text-center text-slate-500">
          No data available for this section.
        </div>
      )}
    </div>
  );
};

  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500">Analytics with custom parameters</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Performance Data Export</h2>
        </div>

        <div className="p-5">
          <div className="w-full md:max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Ticker <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              options={tickers}
              value={selectedTicker}
              onChange={handleTickerChange}
              placeholder="Select a company..."
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end md:max-w-3xl">
            <DatePicker
              label="Start date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              max={customEndDate || undefined}
            />
            <DatePicker
              label="End date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              min={customStartDate || undefined}
            />
            <button
              type="button"
              onClick={calculateCustomPeriod}
              disabled={!selectedTicker || !customStartDate || !customEndDate || isLoading}
              className={`h-10 px-4 rounded-md text-white ${(!selectedTicker || !customStartDate || !customEndDate || isLoading) ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              Calculate
            </button>
          </div>
        </div>
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 p-10 border-t border-slate-200">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500">
              Fetching performance data for <strong>{selectedTicker}</strong>...
            </p>
          </div>
        )}
        {!isLoading && performanceData && (
          <div className="flex flex-col gap-8 p-5 border-t border-slate-200">
            {renderTable('Dynamic Periods', performanceData.dynamicPeriods)}
            {renderTable('Predefined Periods', performanceData.predefinedPeriods)}
            {renderTable('Annual Returns', performanceData.annualReturns)}
            {performanceData.quarterlyReturns && renderTable('Quarterly Returns', performanceData.quarterlyReturns)}
            {performanceData.monthlyReturns && renderTable('Monthly Returns', performanceData.monthlyReturns)}
            {performanceData.customRange && performanceData.customRange.length > 0 && renderTable('Selected Period', performanceData.customRange)}
             </div>
        )}
     
      </div>
    </div>
  );
};

export default AnalyticsData;
