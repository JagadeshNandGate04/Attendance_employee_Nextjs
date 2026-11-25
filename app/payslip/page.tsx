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

  const thBase =
    'border-y border-[#536149] bg-gradient-to-r from-[#4E5A45] to-[#68775C] px-4 py-4 text-[13px] font-black uppercase tracking-wider text-white whitespace-nowrap shadow-sm';

  const previewBtn =
    'inline-flex items-center gap-2 rounded-xl border border-[#D9E2D2] bg-[#F6F8F3] px-4 py-2.5 text-sm font-bold text-[#46513F] shadow-xs transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95 disabled:opacity-60';
  const pdfBtn =
    'inline-flex items-center gap-2 rounded-xl border border-[#C87961] bg-[#C87961] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:border-[#B86A54] hover:bg-[#B86A54] active:scale-95 disabled:opacity-60';

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
      <main className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] sm:rounded-[42px] border border-[#ECE3D3]/80 bg-[#FCFAF7] p-4 shadow-[0_24px_64px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:p-6 lg:p-8">

        {/* Top App Bar Navigation */}
        <TopNav active="payslip" />

        {/* Header Bar */}
        <div className="mt-2 flex flex-col justify-between gap-4 border-b border-[#ECE3D3] pb-4 md:flex-row md:items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#5D6953]">
              FINANCE &amp; PAYROLL ARCHIVE
            </span>
            <h1 className="mt-0.5 text-3xl font-black text-stone-900 sm:text-4xl">
              Payslips &amp; Salary Statements
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-stone-600 sm:text-base">
              Transparent monthly compensation breakdowns, deductions, tax compliance, and downloadable signed PDFs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-[#D9E2D2] bg-[#F6F8F3] px-5 py-2.5 text-sm font-bold text-[#46513F] shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5D6953] opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#5D6953]"></span>
              </span>
              Direct Deposit: HDFC Bank •••• 4892
            </span>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-[#D9E2D2] bg-white px-5 py-3 text-sm font-bold text-[#46513F] shadow-xs transition hover:border-[#5D6953] hover:bg-[#F6F8F3] active:scale-95">
              <FiFileText className="text-base text-[#707C65]" />
              Annual Tax Form 16
            </button>
          </div>
        </div>

        {/* 3. Metric Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex min-h-44 flex-col justify-between rounded-2xl bg-gradient-to-br from-[#5D6953] to-[#414B3A] p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#E8EEDF]">TOTAL PUBLISHED</span>
              <FiFileText className="text-xl text-white/80" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white sm:text-4xl">{loading ? '…' : total || 14}</p>
              <p className="mt-1 text-sm font-semibold text-[#DCE4D5]">Statements on record</p>
              <p className="mt-0.5 text-sm text-white/80">Continuous coverage since Oct 2025</p>
            </div>
          </div>

          <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#E8D4B9] bg-gradient-to-br from-[#FFFDF8] to-[#F8EBD9] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#EDD7BE] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#815526]">NEXT PAYDAY</span>
              <FiCalendar className="text-xl text-[#9B6A38]" />
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-3xl font-black text-stone-900 sm:text-4xl">30 Nov</p>
                <span className="rounded-md bg-[#E3BF96]/30 px-2.5 py-1 text-xs font-black text-[#8A5725]">IN 10 DAYS</span>
              </div>
              <p className="mt-1 text-sm text-stone-600">Monthly auto-credit cycle (100% attendance)</p>
            </div>
          </div>

          <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#F3C9BB] bg-gradient-to-br from-[#FFF8F5] to-[#FCE5DC] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#F4C8B9] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#B24832]">YTD TAX DEDUCTIONS</span>
              <FiCheckCircle className="text-xl text-[#C85D44]" />
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-3xl font-black text-stone-900 sm:text-4xl">₹1,48,200</p>
                <span className="text-sm font-bold text-[#B24832]">FY 2026–27</span>
              </div>
              <p className="mt-1 text-sm text-stone-600">TDS, Provident Fund &amp; ESI documented</p>
            </div>
          </div>

          <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#D9E2D2] bg-gradient-to-br from-white to-[#F0F5EB] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#D9E2D2] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#46513F]">LAST NET TRANSFERRED</span>
              <FiDownload className="text-xl text-[#5D6953]" />
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-3xl font-black text-stone-900 sm:text-4xl">₹84,500</p>
                <span className="rounded-md bg-[#5D6953]/15 px-2.5 py-1 text-xs font-black text-[#46513F]">OCT 2026</span>
              </div>
              <p className="mt-1 text-sm text-stone-600">Credited on 30 Oct 2026 • Ref #NG-9482</p>
            </div>
          </div>
        </div>

        {/* 4. Filter Controls Row */}
        <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-[#E5DDCE] bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="mr-1 text-xs font-black uppercase tracking-wider text-[#5D6953]">Fiscal Year:</span>
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
                  aria-pressed={isActive}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#C87961] text-white shadow-xs'
                      : 'border border-[#ECE3D3] bg-white text-stone-600 hover:border-[#707C65] hover:bg-[#F6F8F3]'
                  }`}
                >
                  {year === 'All' ? `All Years (${total || filteredPayslips.length})` : year}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:max-w-xl lg:flex-1 lg:justify-end">
            <div className="relative min-w-[240px] flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-[#707C65]" />
              <input
                type="text"
                aria-label="Search payslips"
                placeholder="Search month, slip ID, or tag..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-[#E5DDCE] bg-[#FCFAF7] py-3 pl-11 pr-10 text-sm font-semibold text-stone-800 placeholder:text-stone-400 focus:border-[#5D6953] focus:bg-white focus:outline-none"
              />
              {searchQuery && (
                <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-stone-400 hover:text-stone-700">
                  <FiX />
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-[#E5DDCE] bg-[#FCFAF7] px-4 py-3 text-sm text-stone-700">
              <span className="text-xs font-black uppercase tracking-wider text-[#5D6953]">Sort:</span>
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

        {/* 5. Payslips List */}
        <div className="overflow-hidden rounded-3xl border border-[#E5DDCE] bg-[#FCFAF7] shadow-md">
          {/* Mobile & Tablet Card List */}
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-2 xl:hidden">
            {loading ? (
              <p role="status" className="col-span-full rounded-2xl bg-white px-4 py-10 text-center text-sm font-bold text-stone-600">Loading payroll statements…</p>
            ) : filteredPayslips.length === 0 ? (
              <p className="col-span-full rounded-2xl bg-white px-4 py-10 text-center text-sm font-bold text-stone-600">No payslips found matching your filters.</p>
            ) : (
              paginatedSlips.map((slip, idx) => (
                <article key={slip.id} className="rounded-2xl border-2 border-[#ECE3D3] bg-white p-5 shadow-sm transition hover:border-[#707C65]/40 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#5D6953] text-white shadow-sm ring-1 ring-black/5">
                        <FiCalendar className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-black text-stone-900">{MONTH_NAMES[slip.month - 1]} {slip.year}</span>
                          {idx === 0 && <span className="rounded-full bg-[#E2EBD9] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-[#46513F]">LATEST</span>}
                        </div>
                        <span className="font-mono text-sm font-medium text-stone-500">SLIP-{slip.id.slice(0, 10)}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#D9E2D2] bg-[#F6F8F3] px-3.5 py-1.5 text-sm font-bold text-[#5D6953]">
                      <span className="h-2 w-2 rounded-full bg-[#5D6953]" aria-hidden="true" />
                      Disbursed
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#E5DDCE] bg-[#F7F3EB] px-4 py-3.5">
                    <p className="text-xs font-black uppercase tracking-wider text-[#5D6953]">Net pay disbursed</p>
                    <p className="mt-0.5 font-mono text-2xl font-black text-[#46513F]">₹84,500</p>
                    <p className="text-sm font-medium text-stone-500">Bank A/C •••• 4892</p>
                  </div>

                  <div className="mt-3 space-y-1.5 rounded-xl border border-[#E5DDCE] bg-white px-4 py-3">
                    <div className="flex justify-between text-sm"><span className="font-medium text-stone-600">Gross</span><span className="font-black text-stone-900">₹98,000</span></div>
                    <div className="flex justify-between text-sm"><span className="font-medium text-[#C85D44]">Deductions</span><span className="font-black text-[#C85D44]">-₹13,500</span></div>
                    <div className="flex justify-between border-t border-[#ECE3D3] pt-1.5 text-sm"><span className="font-medium text-stone-600">Published</span><span className="font-bold text-stone-800">{new Date(slip.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => void dispatch(viewMyPayslip(slip.id))}
                      disabled={viewingIds.includes(slip.id)}
                      className={previewBtn}
                    >
                      <FiEye className="text-base" />
                      {viewingIds.includes(slip.id) ? 'Opening…' : 'Preview'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(slip)}
                      disabled={downloadingIds.includes(slip.id)}
                      className={pdfBtn}
                    >
                      <FiDownload className="text-base" />
                      {downloadingIds.includes(slip.id) ? 'Saving…' : 'PDF'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Desktop Row-Card Table */}
          <div className="hidden w-full overflow-x-auto px-5 pb-5 pt-3 xl:block">
            <table className="w-full min-w-[1100px] table-fixed border-separate border-spacing-y-2.5 text-left">
              <colgroup>
                <col className="w-[27%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[15%]" />
                <col className="w-[22%]" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className={`${thBase} rounded-l-xl border-l`}>Period &amp; Identifier</th>
                  <th scope="col" className={thBase}>Net Pay Disbursed</th>
                  <th scope="col" className={thBase}>Earnings &amp; Deductions</th>
                  <th scope="col" className={thBase}>Disbursement</th>
                  <th scope="col" className={`${thBase} rounded-r-xl border-r`}>Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-stone-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="rounded-2xl bg-white px-4 py-12 text-center text-sm font-bold text-stone-500">Loading payroll statements…</td>
                  </tr>
                ) : filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="rounded-2xl bg-white px-4 py-12 text-center text-sm font-bold text-stone-500">No payslips found matching your filters.</td>
                  </tr>
                ) : (
                  paginatedSlips.map((slip, idx) => (
                    <tr key={slip.id} className="group transition-colors">
                      <td className="rounded-l-2xl border-y border-l border-[#ECE3D3] bg-white px-4 py-4 align-middle transition-colors group-hover:bg-[#FAF7F0]">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#5D6953] text-white shadow-sm ring-1 ring-black/5">
                            <FiCalendar className="text-2xl" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-black text-stone-900">{MONTH_NAMES[slip.month - 1]} {slip.year}</span>
                              {idx === 0 && <span className="rounded-full bg-[#E2EBD9] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-[#46513F]">LATEST</span>}
                            </div>
                            <span className="font-mono text-sm font-medium text-stone-500">SLIP-{slip.id.slice(0, 10)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="border-y border-[#ECE3D3] bg-white px-4 py-4 align-middle transition-colors group-hover:bg-[#FAF7F0]">
                        <div className="flex flex-col">
                          <span className="font-mono text-xl font-black text-[#46513F]">₹84,500</span>
                          <span className="text-sm font-medium text-stone-500">Bank A/C •••• 4892</span>
                        </div>
                      </td>
                      <td className="border-y border-[#ECE3D3] bg-white px-4 py-4 align-middle transition-colors group-hover:bg-[#FAF7F0]">
                        <div className="flex max-w-[210px] flex-col gap-1.5">
                          <div className="flex justify-between text-sm"><span className="font-medium text-stone-600">Gross:</span><span className="font-black text-stone-900">₹98,000</span></div>
                          <div className="flex justify-between text-sm text-[#C85D44]"><span className="font-medium">Deductions:</span><span className="font-black">-₹13,500</span></div>
                        </div>
                      </td>
                      <td className="border-y border-[#ECE3D3] bg-white px-4 py-4 align-middle transition-colors group-hover:bg-[#FAF7F0]">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-stone-800">{new Date(slip.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D9E2D2] bg-[#F6F8F3] px-3 py-1 text-sm font-bold text-[#5D6953]">
                            <span className="h-2 w-2 rounded-full bg-[#5D6953]" aria-hidden="true"></span> Disbursed
                          </span>
                        </div>
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-[#ECE3D3] bg-white px-4 py-4 align-middle transition-colors group-hover:bg-[#FAF7F0]">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => void dispatch(viewMyPayslip(slip.id))}
                            disabled={viewingIds.includes(slip.id)}
                            className={previewBtn}
                          >
                            <FiEye className="text-base" />
                            {viewingIds.includes(slip.id) ? 'Opening…' : 'Preview'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(slip)}
                            disabled={downloadingIds.includes(slip.id)}
                            className={pdfBtn}
                          >
                            <FiDownload className="text-base" />
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DDCE] bg-[#FAF7F0] px-5 py-4 text-sm font-medium text-stone-600 sm:px-6">
            <span>
              Showing <strong className="font-bold text-stone-900">{filteredPayslips.length ? (visiblePage - 1) * itemsPerPage + 1 : 0}–{Math.min(visiblePage * itemsPerPage, filteredPayslips.length)}</strong> of <strong className="font-bold text-stone-900">{filteredPayslips.length}</strong> statements
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={visiblePage === 1}
                className="rounded-xl border border-[#E5DDCE] bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-[#F6F8F3] hover:text-[#5D6953] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="rounded-xl bg-[#5D6953] px-4 py-2.5 text-sm font-black text-white shadow-sm">{visiblePage}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={visiblePage === totalPages}
                className="rounded-xl border border-[#E5DDCE] bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-[#F6F8F3] hover:text-[#5D6953] disabled:opacity-40"
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