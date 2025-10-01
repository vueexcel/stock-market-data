import React, { useState, useMemo } from 'react';
import { Database, Download } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import DatePicker from '../components/DatePicker';
import Select from '../components/Select';
import { BASE_URL } from '../utils/api';
import axios from 'axios';
import indexTickersRaw from '../data/tickers.json'; //tickers JSON

const BigQueryData = () => {
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [interval, setInterval] = useState('1d');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const indexTickers: Record<string, string[]> = Object.fromEntries(
    Object.entries(indexTickersRaw).map(([k, v]) => [k, Array.from(new Set(v))])
  );

  const intervalOptions = [
    { value: '1d', label: 'Daily' },
    { value: '1wk', label: 'Weekly' },
    { value: '1mo', label: 'Monthly' },
  ];

  const indexOptions = [
    { value: '', label: 'Select Stock' },
    { value: 'ND', label: 'NASDAQ 100' },
    { value: 'SP', label: 'S&P 500' },
    { value: 'DJ', label: 'Dow Jones' },
    { value: 'ETF', label: 'ETF' },
    { value: 'Others', label: 'Others' },
  ];

  const filteredOptions = useMemo(() => {
    if (!selectedIndex) return [];
    return (indexTickers[selectedIndex] || [])
      .filter((t) => t.toLowerCase().includes(search.toLowerCase()))
      .sort();
  }, [selectedIndex, search]);

  const handleIndexChange = (value: string) => {
    setSelectedIndex(value);
    setTickers([]);
    setSearch('');
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setTickers(filteredOptions);
    } else {
      setTickers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (tickers.length === 0) {
        setErrorMsg('Please select at least one ticker.');
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/download_bigquery_data`,
        {
          bigquery_ticker: tickers,
          bigquery_start_date: startDate,
          bigquery_end_date: endDate,
          bigquery_interval: interval,
        },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // link.setAttribute('download', `bigquery_data_${interval}{time}.xlsx`);
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US').replace(/\//g, '_');
      const timeString = now.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
      link.setAttribute('download', `bigquery_data_${interval}_${dateString}_${timeString}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download failed:', error);
      setErrorMsg('Failed to download BigQuery data.');
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">BigQuery Data</h1>
          <p className="text-gray-600">Query large datasets with custom parameters</p>
        </div>
      </div>

      <Card title="BigQuery Data Export">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Select
                label="Select Company"
                value={selectedIndex}
                onChange={handleIndexChange}
                options={indexOptions}
                required
              />

              {/* Custom Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Ticker(s)
                </label>
                <div className="relative">
                  <div
                    onClick={() => selectedIndex && setDropdownOpen(!dropdownOpen)}
                    className={`border rounded-md p-2 cursor-pointer bg-white ${
                      !selectedIndex ? 'text-gray-400 cursor-not-allowed' : ''
                    }`}
                  >
                    {!selectedIndex
                      ? 'Select a company first...'
                      : tickers.length > 0
                      ? `${tickers.length} tickers selected`
                      : 'Select or search tickers...'}
                  </div>
                  {dropdownOpen && selectedIndex && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full border rounded px-2 py-1 mb-2 text-sm"
                        />
                        <label className="flex items-center space-x-2 px-1">
                          <input
                            type="checkbox"
                            checked={
                              tickers.length === filteredOptions.length &&
                              filteredOptions.length > 0
                            }
                            onChange={(e) => handleToggleAll(e.target.checked)}
                          />
                          <span className="text-sm">Select All</span>
                        </label>
                      </div>
                      <ul className="max-h-40 overflow-y-auto">
                        {filteredOptions.map((t) => (
                          <li
                            key={t}
                            className="px-2 py-1 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={tickers.includes(t)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTickers((prev) =>
                                    Array.from(new Set([...prev, t]))
                                  );
                                } else {
                                  setTickers((prev) =>
                                    prev.filter((x) => x !== t)
                                  );
                                }
                              }}
                            />
                            <span className="text-sm">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <Select
                label="Data Interval"
                value={interval}
                onChange={setInterval}
                options={intervalOptions}
                required
              />
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />

              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate}
              />
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || !tickers.length || !startDate || !endDate}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>
                {isLoading ? 'Querying BigQuery...' : 'Download BigQuery Data'}
              </span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default BigQueryData;
