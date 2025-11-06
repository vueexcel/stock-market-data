import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, ChevronDown, Hourglass, Loader2 } from 'lucide-react';
import tickersData from '../data/all_tickers.json';
import { BASE_URL } from '../utils/api';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/* ---------------------- Searchable Dropdown ---------------------- */
interface SearchableDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableDropdown = ({ options, value, onChange, placeholder = 'Select an option', disabled = false }: SearchableDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const optionsWithKeys = filteredOptions.map(option => ({
  value: option,
  key: uuidv4(),
}));

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
              <li className="px-4 py-2 text-sm text-slate-500">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ---------------------- Interfaces ---------------------- */
interface MonthlyOHLC {
  month: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adj_close: number;
  ticker: string;
  start_date: string;
  end_date: string;
}

/* ---------------------- Main Component ---------------------- */
const HistoricData = () => {
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyOHLC[]>([]);

  useEffect(() => {
    setTickers(tickersData.tickers);
  }, []);

  const fetchMonthlyData = async (ticker: string) => {
    if (!ticker) return;

    setIsLoading(true);
    setMonthlyData([]);

    try {
      const response = await axios.post(`${BASE_URL}/monthly_ohlc`, { ticker });
      const data = response?.data?.monthlyOHLC || [];
      setMonthlyData(data);
    } catch (error) {
      console.error('❌ Failed to fetch monthly OHLC data:', error);
      setMonthlyData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTickerChange = (ticker: string) => {
    setSelectedTicker(ticker);
    fetchMonthlyData(ticker);
  };

  const renderOHLCtable = (data: MonthlyOHLC[]) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-200">
        <TrendingUp className="h-5 w-5 text-indigo-600" />
        <h3 className="text-md font-semibold text-slate-800">Monthly OHLC Summary</h3>
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Ticker</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Start Date</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">End Date</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Open</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">High</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Low</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Close</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Adj Close</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50">
                  <td className="p-4 text-sm font-semibold text-slate-900">{row.ticker}</td>
                   <td className="p-4 text-sm text-slate-600">{row.start_date}</td>
                  <td className="p-4 text-sm text-slate-600">{row.end_date}</td>
                  <td className="p-4 text-sm text-right font-mono text-slate-600">{row.open.toFixed(2)}</td>
                  <td className="p-4 text-sm text-right font-mono text-green-600">{row.high.toFixed(2)}</td>
                  <td className="p-4 text-sm text-right font-mono text-red-600">{row.low.toFixed(2)}</td>
                  <td className="p-4 text-sm text-right font-mono text-blue-600">{row.close.toFixed(2)}</td>
                  <td className="p-4 text-sm text-right font-mono text-purple-600">{row.adj_close.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 text-sm text-center text-slate-500">
          No monthly data available.
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
          <Hourglass className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Monthly OHLC Data</h1>
          <p className="text-sm text-slate-500">View monthly open, high, low, and close values for selected stocks</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Monthly Data</h2>
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 p-10 border-t border-slate-200">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500">
              Fetching monthly OHLC data for <strong>{selectedTicker}</strong>...
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && monthlyData && (
          <div className="flex flex-col gap-8 p-5 border-t border-slate-200">
            {renderOHLCtable(monthlyData)}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricData;


// import React, { useState, useEffect, useRef } from 'react';
// // import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { TrendingUp,  ChevronDown, Hourglass, Loader2 } from 'lucide-react';
// import tickersData from '../data/all_tickers.json';
// import { BASE_URL } from '../utils/api';
// import axios from 'axios';

// interface SearchableDropdownProps {
//   options: string[];
//   value: string;
//   onChange: (value: string) => void;
//   placeholder?: string;
//   disabled?: boolean;
// }

// const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
//   options,
//   value,
//   onChange,
//   placeholder = 'Select an option',
//   disabled = false,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const filteredOptions = options.filter(option =>
//     option.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleSelect = (option: string) => {
//     onChange(option);
//     setIsOpen(false);
//     setSearchTerm('');
//   };

//   return (
//     <div className="relative w-full" ref={dropdownRef}>
//       <button
//         type="button"
//         onClick={() => !disabled && setIsOpen(!isOpen)}
//         className={`w-full p-2 text-left bg-white border border-slate-300 rounded-md shadow-sm flex justify-between items-center ${disabled
//             ? 'bg-slate-50 cursor-not-allowed'
//             : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
//           }`}
//         disabled={disabled}
//       >
//         <span className={value ? 'text-slate-900' : 'text-slate-400'}>
//           {value || placeholder}
//         </span>
//         <ChevronDown
//           className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
//             }`}
//         />
//       </button>

//       {isOpen && (
//         <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg">
//           <div className="p-2">
//             <input
//               type="text"
//               placeholder="Search..."
//               className="w-full p-2 border border-slate-300 rounded-md"
//               value={searchTerm}
//               onChange={e => setSearchTerm(e.target.value)}
//               autoFocus
//             />
//           </div>
//           <ul className="max-h-60 overflow-y-auto">
//             {filteredOptions.length > 0 ? (
//               filteredOptions.map(option => (
//                 <li
//                   key={option}
//                   onClick={() => handleSelect(option)}
//                   className="px-4 py-2 text-sm text-slate-700 hover:bg-indigo-500 hover:text-white cursor-pointer"
//                 >
//                   {option}
//                 </li>
//               ))
//             ) : (
//               <li className="px-4 py-2 text-sm text-slate-500">
//                 No results found
//               </li>
//             )}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// interface PerformanceRow {
//   period: string;
//   startDate: string;
//   endDate: string;
//   years: number;
//   startPrice: number;
//   endPrice: number;
//   priceDifference: number;
//   totalReturn: number;
//   simpleAnnualReturn: number;
//   cagrPercent: number;
// }

// interface PerformanceGroups {
//   dynamicPeriods: PerformanceRow[];
//   predefinedPeriods: PerformanceRow[];
//   annualReturns: PerformanceRow[];
//   customRange?: PerformanceRow[];
//   //  ms. additional groups can be added here
//   quarterlyReturns?: PerformanceRow[];
//   monthlyReturns?: PerformanceRow[];
// }


// const HistoricData = () => {
//   const [tickers, setTickers] = useState<string[]>([]);
//   const [selectedTicker, setSelectedTicker] = useState<string>('');
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [performanceData, setPerformanceData] = useState<PerformanceGroups | null>(null);


//   useEffect(() => {
//     setTickers(tickersData.tickers);
//   }, []);

//   const fetchPerformanceData = async (ticker: string) => {
//     if (!ticker) return;

//     setIsLoading(true);
//     setPerformanceData(null);

//     try {
//       const response = await axios.post(`${BASE_URL}/analytics_performance`, { ticker });
//       setPerformanceData(response?.data?.performance || {});
//     } catch (error) {
//       console.error('❌ Failed to fetch performance data:', error);
//       setPerformanceData({ dynamicPeriods: [], predefinedPeriods: [], annualReturns: [], customRange: [] });
//     } finally {
//       setIsLoading(false);
//     }
//   };



//   const handleTickerChange = (ticker: string) => {
//     setSelectedTicker(ticker);
//     fetchPerformanceData(ticker);
//   };
//   const renderTable = (title: string, data: PerformanceRow[]) => (
//     <div key={title} className="border border-slate-200 rounded-lg overflow-hidden">
//       <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-200">
//         <TrendingUp className="h-5 w-5 text-indigo-600" />
//         <h3 className="text-md font-semibold text-slate-800">{title}</h3>
//       </div>
//       {data && data.length > 0 ? (
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-slate-50">
//               <tr>
//                 <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Period</th>
//                 <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Start Date</th>
//                 <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">End Date</th>
//                 <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Years</th>
//                 <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Start Price</th>
//                 <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">End Price</th>
//                 <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Price Diff</th>
//                 <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Total Return (%)</th>
//                 <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Simple Annual (%)</th>
//                 <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">CAGR (%)</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-200">
//               {data.map((row) => (
//                 <tr key={row.period} className="hover:bg-slate-50">
//                   <td className="p-4 text-sm font-semibold text-slate-900">{row.period}</td>
//                   <td className="p-4 text-sm text-slate-600">{row.startDate}</td>
//                   <td className="p-4 text-sm text-slate-600">{row.endDate}</td>
//                   <td className="p-4 text-sm text-right text-slate-600 font-mono">{row.years?.toFixed(1)}</td>
//                   <td className="p-4 text-sm text-right text-slate-600 font-mono">{row.startPrice?.toLocaleString()}</td>
//                   <td className="p-4 text-sm text-right text-slate-600 font-mono">{row.endPrice?.toLocaleString()}</td>
//                   <td
//                     className={`p-4 text-sm text-right font-mono ${row.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'
//                       }`}
//                   >
//                     {row.priceDifference?.toLocaleString()}
//                   </td>
//                   <td
//                     className={`p-4 text-sm text-right font-semibold ${row.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
//                       }`}
//                   >
//                     {row.totalReturn?.toFixed(2)}%
//                   </td>
//                   <td className="p-4 text-sm text-right font-mono text-blue-600">
//                     {row.simpleAnnualReturn?.toFixed(2)}%
//                   </td>
//                   <td className="p-4 text-sm text-right font-mono text-indigo-600">
//                     {row.cagrPercent?.toFixed(2)}%
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         <div className="p-4 text-sm text-center text-slate-500">
//           No data available for this section.
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="flex flex-col gap-6">
//       <div className="flex items-center gap-4">
//         <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
//           <Hourglass className="h-6 w-6 text-indigo-600" />
//         </div>
//         <div>
//           <h1 className="text-2xl font-bold text-slate-800">Monthly Average</h1>
//           <p className="text-sm text-slate-500">Analytics for monthly average value</p>
//         </div>
//       </div>
//       <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
//         <div className="p-5 border-b border-slate-200">
//           <h2 className="text-lg font-semibold text-slate-800">Monthly Data Export</h2>
//         </div>

//         <div className="p-5">
//           <div className="w-full md:max-w-xs">
//             <label className="block text-sm font-medium text-slate-700 mb-1">
//               Select Ticker <span className="text-red-500">*</span>
//             </label>
//             <SearchableDropdown
//               options={tickers}
//               value={selectedTicker}
//               onChange={handleTickerChange}
//               placeholder="Select a company..."
//               disabled={isLoading}
//             />
//           </div>
//         </div>
       
//         {isLoading && (
//           <div className="flex flex-col items-center justify-center gap-4 p-10 border-t border-slate-200">
//             <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
//             <p className="text-slate-500">
//               Fetching performance data for <strong>{selectedTicker}</strong>...
//             </p>
//           </div>
//         )}
//         {!isLoading && performanceData && (
//           <div className="flex flex-col gap-8 p-5 border-t border-slate-200">
//             {renderTable('Dynamic Periods', performanceData.dynamicPeriods)}
//                 </div>
//         )}
     
//       </div>
//     </div>
//   );
// };

// export default HistoricData;
