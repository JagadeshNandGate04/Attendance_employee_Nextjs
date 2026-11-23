'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiDownload, FiEye, FiFileText, FiSearch, FiX, FiCheckCircle } from 'react-icons/fi';
import TopNav from '../components/topNavBar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { downloadMyPayslip, fetchMyPayslips, viewMyPayslip, type Payslip } from '../store/paySlip/payslipSlice';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PayslipsPage() {
  const dispatch = useAppDispatch();
  const { payslips, total, loading, error, downloadingIds, viewingIds, downloadError } =
    useAppSelector((state) => state.payslips);
  const [selectedYear, setSelectedYear] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    void dispatch(fetchMyPayslips());
  }, [dispatch]);

  const years = useMemo(
    () => [...new Set(payslips.map((slip) => slip.year))].sort((a, b) => b - a),
    [payslips]
  );

  const filteredPayslips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return payslips
      .filter((slip) => {
        const month = MONTH_NAMES[slip.month - 1]?.toLowerCase() || '';
        return (
          (selectedYear === 'All' || String(slip.year) === selectedYear) &&
          (!query || month.includes(query) || slip.id.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        const difference = new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
        return sortBy === 'latest' ? -difference : difference;
      });
  }, [payslips, selectedYear, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredPayslips.length / itemsPerPage));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedSlips = filteredPayslips.slice((visiblePage - 1) * itemsPerPage, visiblePage * itemsPerPage);

  const handleDownload = (slip: Payslip) => {
    const month = MONTH_NAMES[slip.month - 1] || String(slip.month);
    void dispatch(downloadMyPayslip({
      id: slip.id,
      filename: `Payslip_${month}_${slip.year}.pdf`,
    }));
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white p-3 sm:p-5 md:p-7 lg:p-9">
      
      {/* 1. Organic Abstract Canvas Artwork Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <svg className="h-full w-full object-cover opacity-90" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M -120 -80 C 180 -120, 380 60, 400 300 C 420 540, 190 640, -60 680 Z" fill="#848F76"/>
          <path d="M 1320 -150 C 1460 60, 1620 250, 2000 210 L 2000 -150 Z" fill="#E3BF96"/>
          <path d="M 1260 1150 C 1420 840, 1660 700, 2040 680 L 2040 1150 Z" fill="#C85D44"/>
          <path d="M 2000 300 C 1720 370, 1640 560, 1830 750 C 1910 830, 2000 870, 2000 870 Z" fill="#D9B288"/>
          <path d="M -60 500 C 320 410, 760 630, 1120 430 C 1470 230, 1740 330, 2040 190" stroke="#707C65" strokeWidth="1.5" strokeOpacity="0.35" fill="none"/>
          <path d="M 260 -60 C 440 330, 310 800, 720 970 C 1130 1140, 1600 900, 1980 1140" stroke="#C85D44" strokeWidth="1.5" strokeOpacity="0.25" fill="none"/>
        </svg>
      </div>

      {/* 2. Main Elevated Dashboard Container Board */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-6 rounded-[36px] sm:rounded-[42px] border border-[#ECE3D3]/90 bg-[#FCFAF7] p-5 shadow-[0_24px_70px_rgba(72,60,45,0.09)] backdrop-blur-sm sm:p-7 lg:p-9">
        
        {/* Top App Bar Navigation */}
        <TopNav active="payslip" />

        {/* Header Bar */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#ECE3D3] pb-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#707C65]">
              FINANCE &amp; PAYROLL ARCHIVE
            </span>
            <h1 className="mt-0.5 text-2xl font-black text-stone-900 sm:text-3xl">
              Payslips &amp; Salary Statements
            </h1>
            <p className="text-xs text-stone-500 sm:text-sm">
              Transparent monthly compensation breakdowns, deductions, tax compliance, and downloadable signed PDFs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D9E2D2] bg-[#F6F8F3] px-4 py-2 text-xs font-bold text-[#5D6953] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5D6953] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5D6953]"></span>
              </span>
              Direct Deposit: HDFC Bank •••• 4892
            </span>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE3D3] bg-white px-3.5 py-2 text-xs font-bold text-stone-700 shadow-2xs transition hover:bg-[#F6F8F3] hover:text-[#5D6953]">
              <FiFileText className="text-[#707C65]" />
              Annual Tax Form 16
            </button>
          </div>
        </div>

        {/* 3. Enhanced Metric Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-3xl bg-[#5D6953] p-5 text-white shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#DCE4D5]">TOTAL PUBLISHED</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
                <FiFileText className="text-lg" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-black text-white sm:text-4xl">{loading ? '…' : total || 14}</p>
              <span className="text-xs font-semibold text-[#D8DEC7]">Statements on record</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-white/80">Continuous coverage since Oct 2025</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[#ECE3D3] bg-[#FDF8F0] p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#9B6A38]">NEXT PAYDAY</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5E7D3] text-[#9B6A38]">
                <FiCalendar className="text-lg" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-black text-stone-900 sm:text-4xl">30 Nov</p>
              <span className="rounded-md bg-[#E3BF96]/30 px-2 py-0.5 text-[10px] font-black text-[#8A5725]">IN 10 DAYS</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-stone-500">Monthly auto-credit cycle (100% attendance)</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[#F3D7CB] bg-[#FFF8F6] p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#C85D44]">YTD TAX DEDUCTIONS</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBE5DC] text-[#C85D44]">
                <FiCheckCircle className="text-lg" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-black text-stone-900 sm:text-4xl">₹1,48,200</p>
              <span className="text-[11px] font-bold text-[#C85D44]">FY 2026–27</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-stone-500">TDS, Provident Fund &amp; ESI documented</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[#D9E2D2] bg-[#F6F8F3] p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5D6953]">LAST NET TRANSFERRED</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E2EBD9] text-[#5D6953]">
                <FiDownload className="text-lg" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-black text-stone-900 sm:text-4xl">₹84,500</p>
              <span className="rounded-md bg-[#5D6953]/15 px-2 py-0.5 text-[10px] font-black text-[#5D6953]">OCT 2026</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-stone-500">Credited on 30 Oct 2026 • Ref #NG-9482</p>
          </div>
        </div>

        {/* 4. Filter Controls Row */}
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-[#ECE3D3] bg-white p-3.5 shadow-xs sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-black uppercase tracking-wider text-[#707C65]">Fiscal Year:</span>
            {['All', ...years.map(String)].map((year) => {
              const isActive = selectedYear === year;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setSelectedYear(year);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#5D6953] text-white shadow-xs'
                      : 'text-stone-600 hover:bg-[#F6F8F3] hover:text-[#5D6953]'
                  }`}
                >
                  {year === 'All' ? `All Years (${total || filteredPayslips.length})` : year}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 sm:max-w-md sm:flex-1">
            <div className="relative min-w-[210px] flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#707C65]" />
              <input
                type="text"
                placeholder="Search month, slip ID, or tag..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-[#ECE3D3] bg-[#FCFAF7] py-2 pl-9 pr-8 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:border-[#5D6953] focus:bg-white focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400">
                  <FiX />
                </button>
              )}
            </div>

            <label className="flex items-center gap-1.5 rounded-xl border border-[#ECE3D3] bg-[#FCFAF7] px-3 py-2 text-xs text-stone-700">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#707C65]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value === 'oldest' ? 'oldest' : 'latest')}
                className="bg-transparent font-bold text-stone-900 focus:outline-none"
              >
                <option value="latest">Latest Published</option>
                <option value="oldest">Earliest Published</option>
              </select>
            </label>
          </div>
        </div>

        {/* 5. Payslips Table */}
        <div className="overflow-hidden rounded-3xl border border-[#ECE3D3] bg-[#FCFAF7] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-y-2 text-left p-3 sm:p-5">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className="rounded-l-2xl border-y border-l border-[#ECE3D3] bg-[#F7F3EB] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-[#5D6953]">Period &amp; Identifier</th>
                  <th className="border-y border-[#ECE3D3] bg-[#F7F3EB] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-[#5D6953]">Net Pay Disbursed</th>
                  <th className="border-y border-[#ECE3D3] bg-[#F7F3EB] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-[#5D6953]">Earnings &amp; Deductions</th>
                  <th className="border-y border-[#ECE3D3] bg-[#F7F3EB] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-[#5D6953]">Disbursement</th>
                  <th className="rounded-r-2xl border-y border-r border-[#ECE3D3] bg-[#F7F3EB] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-[#5D6953]">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-stone-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="rounded-2xl bg-white px-4 py-12 text-center text-xs font-bold text-stone-400">Loading payroll statements…</td>
                  </tr>
                ) : filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="rounded-2xl bg-white px-4 py-12 text-center text-xs font-bold text-stone-400">No payslips found matching your filters.</td>
                  </tr>
                ) : (
                  paginatedSlips.map((slip, idx) => (
                    <tr key={slip.id} className="group transition-colors">
                      <td className="rounded-l-2xl border-y border-l border-[#ECE3D3] bg-white px-4 py-4 transition group-hover:bg-[#FAF7F0]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F6F8F3] text-[#5D6953] ring-1 ring-[#5D6953]/25 shadow-2xs">
                            <FiCalendar className="text-lg" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-stone-900">{MONTH_NAMES[slip.month - 1]} {slip.year}</span>
                              {idx === 0 && <span className="rounded-full bg-[#E2EBD9] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#5D6953]">LATEST</span>}
                            </div>
                            <span className="font-mono text-[11px] font-medium text-stone-400">SLIP-{slip.id.slice(0, 10)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="border-y border-[#ECE3D3] bg-white px-4 py-4 transition group-hover:bg-[#FAF7F0]">
                        <div className="flex flex-col">
                          <span className="font-mono text-base font-black text-[#5D6953]">₹84,500</span>
                          <span className="text-[10px] text-stone-400 font-medium">Bank A/C •••• 4892</span>
                        </div>
                      </td>
                      <td className="border-y border-[#ECE3D3] bg-white px-4 py-4 transition group-hover:bg-[#FAF7F0]">
                        <div className="flex flex-col gap-1 max-w-[180px]">
                          <div className="flex justify-between text-[11px]"><span className="text-stone-500">Gross:</span><span className="font-bold">₹98,000</span></div>
                          <div className="flex justify-between text-[11px] text-[#C85D44]"><span>Deductions:</span><span className="font-bold">-₹13,500</span></div>
                        </div>
                      </td>
                      <td className="border-y border-[#ECE3D3] bg-white px-4 py-4 transition group-hover:bg-[#FAF7F0]">
                        <div className="flex flex-col">
                          <span className="font-bold text-stone-700">{new Date(slip.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> Disbursed
                          </span>
                        </div>
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-[#ECE3D3] bg-white px-4 py-4 transition group-hover:bg-[#FAF7F0]">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void dispatch(viewMyPayslip(slip.id))}
                            disabled={viewingIds.includes(slip.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE3D3] bg-[#FCFAF7] px-3.5 py-2 text-xs font-bold text-[#5D6953] shadow-xs hover:bg-[#F6F8F3] hover:border-[#5D6953] active:scale-95"
                          >
                            <FiEye />
                            {viewingIds.includes(slip.id) ? 'Opening…' : 'Preview'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(slip)}
                            disabled={downloadingIds.includes(slip.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#5D6953] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4D5844] active:scale-95"
                          >
                            <FiDownload />
                            {downloadingIds.includes(slip.id) ? 'Saving…' : 'PDF'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE3D3] bg-white px-5 py-4 text-xs font-medium text-stone-500">
            <span>
              Showing <strong className="text-stone-900 font-bold">{filteredPayslips.length ? (visiblePage - 1) * itemsPerPage + 1 : 0}–{Math.min(visiblePage * itemsPerPage, filteredPayslips.length)}</strong> of <strong className="text-stone-900 font-bold">{filteredPayslips.length}</strong> statements
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={visiblePage === 1}
                className="rounded-xl border border-[#ECE3D3] bg-[#FCFAF7] px-3.5 py-2 font-bold text-stone-700 hover:bg-[#F6F8F3] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="rounded-xl bg-[#5D6953] px-3.5 py-2 font-black text-white shadow-2xs">{visiblePage}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={visiblePage === totalPages}
                className="rounded-xl border border-[#ECE3D3] bg-[#FCFAF7] px-3.5 py-2 font-bold text-stone-700 hover:bg-[#F6F8F3] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}