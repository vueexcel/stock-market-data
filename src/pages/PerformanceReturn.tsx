import { useState, useEffect } from 'react';
import Select from '../components/Select';
import { apiFetch } from '../utils/api';

interface IndexOption {
  value: string;
  label: string;
}

interface TickerDetail {
  row: number;
  symbol: string;
  security: string;
  sector: string;
  industry: string;
  index: string;
  totalReturnPercentage: number | null;
  price: number | null; 
}

const PerformanceReturn = () => {
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [indexOptions, setIndexOptions] = useState<IndexOption[]>([
    { value: 'sp500', label: 'S&P 500' },
    { value: 'nasdaq100', label: 'Nasdaq 100' },
    { value: 'dowjones', label: 'Dow Jones' },
    { value: 'others', label: 'Others' },
  ]);
  const [periodOptions, setPeriodOptions] = useState<IndexOption[]>([
    { value: 'last-date', label: 'Last date' },
    { value: 'week', label: 'Week' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-3-months', label: 'Last 3 months' },
    { value: 'last-6-months', label: 'Last 6 months' },
    { value: 'ytd', label: 'Year to Date (YTD)' },
    { value: 'last-1-year', label: 'Last 1 year' },
    { value: 'last-2-years', label: 'Last 2 years' },
    { value: 'last-3-years', label: 'Last 3 years' },
    { value: 'last-5-years', label: 'Last 5 years' },
    { value: 'last-10-years', label: 'Last 10 years' },
  ]);
  const [tickerData, setTickerData] = useState<TickerDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const response = await apiFetch<{ success: boolean; indices: IndexOption[] }>('/performance_return_indices');
        if (response.success && response.indices) {
          setIndexOptions(response.indices);
        }
      } catch (error) {
        console.error('Failed to fetch indices:', error);
        // Keep default options on error
      }
    };

    const fetchPeriods = async () => {
      try {
        const response = await apiFetch<{ success: boolean; periods: IndexOption[] }>('/performance_return_periods');
        if (response.success && response.periods) {
          setPeriodOptions(response.periods);
        }
      } catch (error) {
        console.error('Failed to fetch periods:', error);
        // Keep default options on error
      }
    };

    fetchIndices();
    fetchPeriods();
  }, []);

  const handleSubmit = async () => {
    if (!selectedIndex || !selectedPeriod) {
      alert('Please select both Index and Period');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTickerData([]);

    try {
      const response = await apiFetch<{
        success: boolean;
        index: string;
        period: string;
        data: TickerDetail[];
      }>('/performance_return_data', {
        method: 'POST',
        data: {
          index: selectedIndex,
          period: selectedPeriod,
        },
      });

      if (response.success && response.data) {
        setTickerData(response.data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err: any) {
      console.error('Failed to fetch ticker data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Heatmap</h1>
          <p className="mt-2 text-gray-600">Select an index to view heatmap</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Select
              label="Select Index"
              options={indexOptions}
              value={selectedIndex}
              onChange={setSelectedIndex}
              placeholder="Select an index..."
              required
            />
          </div>
          <div className="flex-1">
            <Select
              label="Period"
              options={periodOptions}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              placeholder="Select a period..."
              required
            />
          </div>
          <div className="w-full md:w-auto">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
       {tickerData.length > 0 && (() => {
  // Group data by Sector and Industry
  const grouped: {
    [sector: string]: { [industry: string]: TickerDetail[] }
  } = {};

  tickerData.forEach((item) => {
    const sector = item.sector || "Unknown";
    const industry = item.industry || "Unknown";

    if (!grouped[sector]) grouped[sector] = {};
    if (!grouped[sector][industry]) grouped[sector][industry] = [];
    grouped[sector][industry].push(item);
  });

  const sectors = Object.keys(grouped);

  return (
    <div className="space-y-10">
        {/* SELECTED INDEX HEADER */}
    <div className="bg-blue-100 px-4 py-3 rounded border border-blue-300">
      <h2 className="text-xl font-bold text-gray-900">
        Index — {indexOptions.find(i => i.value === selectedIndex)?.label || selectedIndex}
      </h2>
    </div>
      {sectors.map((sector) => {
        const industries = Object.keys(grouped[sector]);

        return (
          <div key={sector} className="border rounded-lg overflow-hidden">
            {/* SECTOR HEADER (BLUE STRIP LIKE IMAGE) */}
            <div className="bg-blue-100 px-4 py-3 border-b border-gray-300">
              <h2 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                Sector — {sector}
              </h2>
            </div>

            {/* INDUSTRIES */}
            {industries.map((industry) => {
              const list = grouped[sector][industry];

              return (
                <div key={industry} className="border-b">
                  {/* INDUSTRY HEADER (GRAY STRIP LIKE IMAGE) */}
                  <div className="bg-gray-100 px-4 py-2 border-b">
                    <h3 className="text-md font-medium text-gray-800">
                    Industry - {industry}
                    </h3>
                  </div>

                  {/* TABLE */}
                  <table className="min-w-full">
                    <thead className="bg-blue-900 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-white">#</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-white">Ticker</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-white">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-white">Sector</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-white">Industry</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-white">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-white">%</th>
                      </tr>
                    </thead>

                    <tbody>
                      {list.map((row, index) => (
                        <tr key={row.row} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{index + 1}</td>
                          <td className="px-4 py-2 text-sm font-medium">{row.symbol}</td>
                          <td className="px-4 py-2 text-sm">{row.security}</td>
                          <td className="px-4 py-2 text-sm">{row.sector}</td>
                          <td className="px-4 py-2 text-sm">{row.industry}</td>
                          <td className="px-4 py-2 text-sm text-right">{row.price}</td>

                          <td
                            className={`px-4 py-2 text-sm text-right font-semibold ${
                              row.totalReturnPercentage !== null && row.totalReturnPercentage >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {row.totalReturnPercentage !== null
                              ? `${row.totalReturnPercentage.toFixed(2)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
})()}

   
 
    </div>
  );
};

export default PerformanceReturn;

