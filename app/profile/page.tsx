'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck, BriefcaseBusiness, CalendarDays, Camera, Check, ChevronRight, CircleUserRound,
  Clock, ContactRound, CreditCard, FileText, GraduationCap, Info, Mail, MapPin, Pencil, Phone, Plus,
  Save, Trash2, UsersRound, X, type LucideIcon,
} from 'lucide-react';
import TopNav from '../components/topNavBar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchEmployeeProfile, fetchProfilePicture, fetchProfileSection, submitProfileRequest, uploadProfilePicture,
  type EmployeeProfile, type ProfileRecord, type ProfileSection, type RequestPayload, type RequestSection, type SectionData,
} from '../store/profile/profileSlice';

type Field = { key: string; label: string; type?: string; options?: string[]; wide?: boolean };
type Section = { id: string; title: string; description: string; icon: LucideIcon; fields: Field[]; api?: ProfileSection; request?: RequestSection; repeatable?: boolean; allowUpdate?: boolean; allowDelete?: boolean };
type Draft = Record<string, string>;

const sections: Section[] = [
  { id: 'personal', title: 'Personal details', description: 'Your basic information and identity.', icon: CircleUserRound, request: 'personal-details', allowUpdate: true, fields: [
    { key: 'name', label: 'Full name' }, { key: 'date_of_birth', label: 'Date of birth', type: 'date' },
    { key: 'marital_status', label: 'Marital status', options: ['Married', 'Unmarried'] }, { key: 'father_spouse_name', label: 'Father or spouse name' },
    { key: 'religion', label: 'Religion' }, { key: 'caste', label: 'Caste' }, { key: 'mother_tongue', label: 'Mother tongue' },
    { key: 'city_of_birth', label: 'City of birth' }, { key: 'country_of_birth', label: 'Country of birth' },
    { key: 'nationality', label: 'Nationality' }, { key: 'community', label: 'Community' },
    { key: 'official_email', label: 'Official email', type: 'email' },
    { key: 'blood_group', label: 'Blood group' }, { key: 'height_cm', label: 'Height (cm)', type: 'number' }, { key: 'weight_kg', label: 'Weight (kg)', type: 'number' },
    { key: 'highest_qualification_level', label: 'Highest qualification' }, { key: 'retirement_age', label: 'Retirement age', type: 'number' },
  ] },
  { id: 'employment', title: 'Employment', description: 'Your details at the organization.', icon: BriefcaseBusiness, fields: [
    { key: 'emp_code', label: 'Employee code' }, { key: 'designation', label: 'Designation' },
    { key: 'date_of_joining', label: 'Date of joining', type: 'date' }, { key: 'status', label: 'Status' },
  ] },
  { id: 'contact', title: 'Contact details', description: 'Your contact information.', icon: ContactRound, fields: [
    { key: 'email', label: 'Email address' }, { key: 'phone', label: 'Mobile number' },
    { key: 'secondary_mobile_no', label: 'Alternate mobile number' }, { key: 'cug_mobile_no', label: 'CUG mobile number' },
    { key: 'contact_email', label: 'Contact email' }, { key: 'official_email', label: 'Official email' },
  ] },
  { id: 'addresses', title: 'Addresses', description: 'Your permanent and communication addresses.', icon: MapPin, api: 'addresses', request: 'addresses', repeatable: true, allowUpdate: true, fields: [
    { key: 'address_type', label: 'Address type', options: ['PERMANENT', 'COMMUNICATION'] },
    { key: 'address_line_1', label: 'Address line 1', wide: true }, { key: 'address_line_2', label: 'Address line 2' },
    { key: 'address_line_3', label: 'Address line 3' }, { key: 'city', label: 'City' }, { key: 'district', label: 'District' },
    { key: 'state', label: 'State' }, { key: 'pincode', label: 'Postal code' }, { key: 'country', label: 'Country' },
  ] },
  { id: 'emergency', title: 'Emergency contacts', description: 'People to contact in an emergency.', icon: ContactRound, api: 'emergency-contacts', request: 'emergency-contacts', repeatable: true, fields: [
    { key: 'contact_name', label: 'Contact name' }, { key: 'relation', label: 'Relationship' },
    { key: 'mobile_no', label: 'Mobile number', type: 'tel' }, { key: 'alternate_mobile_no', label: 'Alternate mobile number', type: 'tel' },
    { key: 'address', label: 'Address', wide: true }, { key: 'is_primary', label: 'Primary contact', options: ['Yes', 'No'] },
  ] },
  { id: 'family', title: 'Family members', description: 'Details of your family members.', icon: UsersRound, api: 'family-members', request: 'family-members', repeatable: true, allowUpdate: true, allowDelete: true, fields: [
    { key: 'name', label: 'Full name' }, { key: 'relation', label: 'Relationship' },
    { key: 'date_of_birth', label: 'Date of birth', type: 'date' }, { key: 'gender', label: 'Gender', options: ['Female', 'Male', 'Non-binary', 'Other'] },
    { key: 'profession', label: 'Profession' }, { key: 'family_member_type', label: 'Member type', options: ['FAMILY_MEMBER'] },
    { key: 'address', label: 'Address', wide: true }, { key: 'remarks', label: 'Remarks', wide: true },
  ] },
  { id: 'education', title: 'Qualifications', description: 'Your education and qualifications.', icon: GraduationCap, api: 'qualifications', request: 'qualifications', repeatable: true, allowUpdate: true, allowDelete: true, fields: [
    { key: 'qualification_type', label: 'Qualification type', options: ['ACADEMIC', 'TECHNICAL'] }, { key: 'qualification', label: 'Qualification' },
    { key: 'institute_name', label: 'Institution' }, { key: 'specialization', label: 'Specialization' },
    { key: 'from_year', label: 'From year', type: 'number' }, { key: 'to_year', label: 'To year', type: 'number' }, { key: 'remarks', label: 'Remarks', wide: true },
  ] },
  { id: 'identity', title: 'Identity details', description: 'Your identification documents.', icon: FileText, request: 'identity-details', allowUpdate: true, allowDelete: true, fields: [
    { key: 'aadhaar_number', label: 'Aadhaar number' }, { key: 'pan_number', label: 'PAN number' },
    { key: 'voter_id_number', label: 'Voter ID number' }, { key: 'driving_license_number', label: 'Driving licence number' },
  ] },
  { id: 'bank', title: 'Bank details', description: 'Your account information for payroll.', icon: CreditCard, fields: [
    { key: 'bank_name', label: 'Bank name' }, { key: 'branch_name', label: 'Branch name' },
    { key: 'account_holder_name', label: 'Account holder name' }, { key: 'account_number', label: 'Account number' }, { key: 'ifsc_code', label: 'IFSC code' },
  ] },
  { id: 'experience', title: 'Work experience', description: 'Your previous employment history.', icon: CalendarDays, api: 'work-experiences', request: 'work-experiences', repeatable: true, allowUpdate: true, allowDelete: true, fields: [
    { key: 'previous_org_name', label: 'Organization' }, { key: 'designation', label: 'Designation' },
    { key: 'from_date', label: 'From date', type: 'date' }, { key: 'to_date', label: 'To date', type: 'date' }, { key: 'remarks', label: 'Remarks', wide: true },
  ] },
];

const personalEditableFields = new Set([
  'date_of_birth', 'marital_status', 'father_spouse_name', 'religion', 'mother_tongue',
  'city_of_birth', 'country_of_birth', 'nationality', 'official_email', 'retirement_age',
  'highest_qualification_level', 'blood_group', 'height_cm', 'weight_kg',
]);

// Shared UI class strings
const inputClass = 'mt-1.5 block h-11 w-full min-w-0 rounded-xl border border-[#E5DDCE] bg-white px-3.5 text-[15px] font-medium text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 hover:border-[#707C65]/50 focus:border-[#707C65] focus:ring-4 focus:ring-[#707C65]/15';
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953]';

function displayValue(value: ProfileRecord[string] | undefined, field?: Field): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (field?.type === 'date' && typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  }
  return String(value);
}

function valuesMatch(left: ProfileRecord[string] | undefined, right: ProfileRecord[string] | undefined, field?: Field): boolean {
  const leftValue = displayValue(left, field);
  const rightValue = displayValue(right, field);
  if (field?.type === 'number' && leftValue !== '' && rightValue !== '') {
    return Number(leftValue) === Number(rightValue);
  }
  return leftValue === rightValue;
}

function getRecords(section: Section, data: EmployeeProfile, sectionData?: SectionData): ProfileRecord[] {
  if (section.id === 'personal' || section.id === 'contact' || section.id === 'employment') return [{ ...data.profile, ...data.employee }];
  if (section.id === 'identity') return data.identity_details ? [data.identity_details] : [];
  if (section.id === 'bank') return data.bank_details ? [data.bank_details] : [];
  if (section.id === 'addresses') return sectionData?.addresses ?? data.addresses ?? [];
  if (section.id === 'emergency') return sectionData?.contacts ?? data.emergency_contacts ?? [];
  if (section.id === 'family') return sectionData?.family_members ?? data.family_members ?? [];
  if (section.id === 'education') return sectionData?.qualifications ?? data.qualifications ?? [];
  if (section.id === 'experience') return sectionData?.experiences ?? data.work_experiences ?? [];
  return [];
}

// Distinct color themes for each section (three palettes: sand, sage, rust)
type Theme = { bg: string; border: string; text: string; iconBg: string; iconText: string; headerBg: string; headerBorder: string };

const sandTheme: Theme = { bg: 'bg-gradient-to-br from-[#FFFDF8] to-[#F8EBD9]', border: 'border-[#E8D4B9]', text: 'text-[#815526]', iconBg: 'bg-[#FDF8F0]', iconText: 'text-[#9B6A38]', headerBg: 'bg-[#FDF8F0]', headerBorder: 'border-[#EDD7BE]' };
const sageTheme: Theme = { bg: 'bg-gradient-to-br from-[#F6F8F3] to-[#EAF0E6]', border: 'border-[#D9E2D2]', text: 'text-[#46513F]', iconBg: 'bg-[#EAF0E6]', iconText: 'text-[#5D6953]', headerBg: 'bg-[#F6F8F3]', headerBorder: 'border-[#D9E2D2]' };
const rustTheme: Theme = { bg: 'bg-gradient-to-br from-[#FFF8F5] to-[#FCE5DC]', border: 'border-[#F3C9BB]', text: 'text-[#B24832]', iconBg: 'bg-[#FEF1EC]', iconText: 'text-[#C85D44]', headerBg: 'bg-[#FEF1EC]', headerBorder: 'border-[#F4C8B9]' };

const sectionThemes: Record<string, Theme> = {
  personal: sandTheme,
  employment: sageTheme,
  contact: rustTheme,
  addresses: sandTheme,
  emergency: rustTheme,
  family: sageTheme,
  education: sandTheme,
  identity: rustTheme,
  bank: sageTheme,
  experience: sandTheme,
};

// Display-only: quick facts shown in the profile summary card
function HeroFacts({ data }: { data: EmployeeProfile }) {
  const record: ProfileRecord = { ...data.profile, ...data.employee };
  const facts = [
    { label: 'Status', icon: BadgeCheck, wide: false, value: displayValue(record.status) },
    { label: 'Joined', icon: CalendarDays, wide: false, value: displayValue(record.date_of_joining, { key: 'date_of_joining', label: 'Date of joining', type: 'date' }) },
    { label: 'Email', icon: Mail, wide: true, value: displayValue(record.official_email) || displayValue(record.email) },
    { label: 'Mobile', icon: Phone, wide: true, value: displayValue(record.phone) },
  ].filter((fact) => fact.value !== '');

  if (facts.length === 0) return null;

  return (
    <dl className="grid min-w-0 grid-cols-2 gap-3 xl:w-[520px] xl:shrink-0">
      {facts.map(({ label, icon: Icon, wide, value }) => (
        <div key={label} className={`min-w-0 rounded-2xl bg-white/10 px-3.5 py-2.5 ring-1 ring-white/10 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}>
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-[#C9D3BF]">
            <Icon size={13} aria-hidden="true" />
            {label}
          </dt>
          <dd className="mt-0.5 truncate text-sm font-bold text-white sm:text-[15px]" title={value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { data, loading, error, sectionLoading: loadingSections, sectionError: sectionErrors, submitting, picture, pictureLoading, pictureError } = useAppSelector((state) => state.profile);
  const [activeId, setActiveId] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [original, setOriginal] = useState<ProfileRecord | null>(null);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [personalTab, setPersonalTab] = useState<'details' | 'pending'>('details');
  const fileRef = useRef<HTMLInputElement>(null);
  
  const active = sections.find((section) => section.id === activeId) ?? sections[0];
  const theme = sectionThemes[active.id] ?? sectionThemes.personal;
  
  const fetchedSections = useAppSelector((state) => state.profile.sections);
  const selectedData = active.api ? fetchedSections[active.api] : undefined;
  const sectionLoading = active.api ? loadingSections[active.api] : false;
  const sectionError = active.api ? sectionErrors[active.api] : null;

  useEffect(() => { void dispatch(fetchEmployeeProfile()); }, [dispatch]);
  useEffect(() => { if (data?.profile?.profile_picture?.available) void dispatch(fetchProfilePicture()); }, [dispatch, data]);
  useEffect(() => { if (data && active.api) void dispatch(fetchProfileSection(active.api)); }, [dispatch, active.api, data]);

  const records = data ? getRecords(active, data, selectedData) : [];
  const pendingSection = active.id === 'personal' ? 'PERSONAL' : active.id === 'identity' ? 'IDENTITY' : '';
  const pending = active.api ? selectedData?.pending_requests ?? [] : (data?.pending_requests ?? []).filter((item) => item.section === pendingSection && pendingSection !== '');
  const editFields = active.id === 'personal' ? active.fields.filter((field) => personalEditableFields.has(field.key)) : active.fields;
  const displayName = displayValue(data?.employee?.name) || 'Your profile';

  function startEditing(record: ProfileRecord | null) {
    const values: Draft = {};
    editFields.forEach((field) => { values[field.key] = displayValue(record?.[field.key], field); });
    if (!record && active.id === 'family') values.family_member_type = 'FAMILY_MEMBER';
    if (!record && active.id === 'education') values.qualification_type = 'ACADEMIC';
    if (!record && active.id === 'emergency') values.is_primary = 'Yes';
    setDraft(values); setOriginal(record); setFormError(''); setNotice(''); setEditing(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active.request) return;
    const payload: RequestPayload = {};
    const personal = active.request === 'personal-details';
    if (active.request !== 'addresses' && !personal) payload.request_type = original ? 'UPDATE' : 'CREATE';
    if (original && active.request !== 'addresses' && !personal) {
      if (original.id == null) { setFormError('This record cannot be updated because its ID is missing.'); return; }
      payload.id = original.id;
    }
    let hasChanges = false;
    for (const field of editFields) {
      const value = draft[field.key] ?? '';
      const changed = !original || value !== displayValue(original[field.key], field);
      if (changed) hasChanges = true;
      if (original && active.request !== 'addresses' && !personal && !changed) continue;
      if (field.key === 'is_primary') payload[field.key] = value === 'Yes';
      else if (field.type === 'number') {
        const number = Number(value);
        if (value !== '' && (!Number.isFinite(number) || number < 0 || (field.key === 'retirement_age' && !Number.isInteger(number)))) {
          setFormError(`Enter a valid ${field.label.toLowerCase()}.`); return;
        }
        payload[field.key] = value === '' ? null : number;
      }
      else payload[field.key] = value;
    }
    if (active.request === 'addresses' && !payload.address_type) { setFormError('Select an address type.'); return; }
    if ((personal && !hasChanges) || (!personal && Object.keys(payload).length <= (original && active.request !== 'addresses' ? 2 : 1))) { setFormError('Enter at least one change.'); return; }
    try {
      const result = await dispatch(submitProfileRequest({ section: active.request, payload })).unwrap();
      setEditing(false); setNotice('Your change request has been submitted for approval.'); setFormError('');
      if (personal) {
        setPersonalTab('pending');
        if (!result.request) await dispatch(fetchEmployeeProfile());
      }
      else if (active.api) await dispatch(fetchProfileSection(active.api));
      else await dispatch(fetchEmployeeProfile());
    } catch (reason) { setFormError(typeof reason === 'string' ? reason : 'Unable to submit the request.'); }
  }

  async function removeRecord(record: ProfileRecord) {
    if (!active.request || record.id == null || !window.confirm('Submit a request to delete this record?')) return;
    setFormError(''); setNotice('');
    try {
      await dispatch(submitProfileRequest({ section: active.request, payload: { request_type: 'DELETE', id: record.id } })).unwrap();
      setNotice('Your deletion request has been submitted for approval.');
      if (active.api) await dispatch(fetchProfileSection(active.api));
      else await dispatch(fetchEmployeeProfile());
    } catch (reason) { setFormError(typeof reason === 'string' ? reason : 'Unable to submit the request.'); }
  }

  async function uploadPicture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setFormError('Please select an image file.'); return; }
    try {
      await dispatch(uploadProfilePicture(file)).unwrap();
      setNotice('Profile picture updated.'); setFormError('');
      await dispatch(fetchProfilePicture());
    } catch (reason) { setFormError(typeof reason === 'string' ? reason : 'Unable to upload the picture.'); }
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] p-3 font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white sm:p-5 md:p-7 lg:p-9">

      {/* Organic Abstract Canvas Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <svg className="h-full w-full object-cover opacity-90" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M -120 -80 C 180 -120, 380 60, 400 300 C 420 540, 190 640, -60 680 Z" fill="#848F76" />
          <path d="M 1320 -150 C 1460 60, 1620 250, 2000 210 L 2000 -150 Z" fill="#E3BF96" />
          <path d="M 1260 1150 C 1420 840, 1660 700, 2040 680 L 2040 1150 Z" fill="#C85D44" />
          <path d="M 2000 300 C 1720 370, 1640 560, 1830 750 C 1910 830, 2000 870, 2000 870 Z" fill="#D9B288" />
          <path d="M -60 500 C 320 410, 760 630, 1120 430 C 1470 230, 1740 330, 2040 190" stroke="#707C65" strokeWidth="1.5" strokeOpacity="0.35" fill="none" />
          <path d="M 260 -60 C 440 330, 310 800, 720 970 C 1130 1140, 1600 900, 1980 1140" stroke="#C85D44" strokeWidth="1.5" strokeOpacity="0.25" fill="none" />
        </svg>
      </div>

      {/* Main Elevated Dashboard Container Board */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] border border-[#ECE3D3]/80 bg-[#FCFAF7] p-4 shadow-[0_24px_64px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:rounded-[42px] sm:p-6 lg:p-8">
        <TopNav />

        <main className="flex w-full flex-col gap-5">

          {/* Page header */}
          <header className="mt-2 border-b border-[#ECE3D3] pb-5">
            <span className="text-xs font-black uppercase tracking-widest text-[#5D6953]">EMPLOYEE ACCOUNT</span>
            <h1 className="mt-0.5 text-3xl font-black text-stone-900 sm:text-4xl">My Profile</h1>
            <p className="mt-1 text-sm leading-relaxed text-stone-600 sm:text-base">
              Your personal and employment information, all in one place.
            </p>
          </header>

          {/* Loading state */}
          {loading && (
            <p role="status" className="flex w-fit items-center gap-3 rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] px-5 py-3 text-base font-bold text-[#5D6953]">
              <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-[#5D6953]/30 border-t-[#5D6953] motion-reduce:animate-none" />
              Loading profile...
            </p>
          )}
          {loading && !data && (
            <div aria-hidden="true" className="flex flex-col gap-5">
              <div className="h-48 animate-pulse rounded-3xl bg-[#EFE9DF] motion-reduce:animate-none sm:h-40" />
              <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
                <div className="h-20 animate-pulse rounded-2xl bg-[#F4EFE6] motion-reduce:animate-none lg:h-[28rem]" />
                <div className="h-96 animate-pulse rounded-3xl bg-[#F4EFE6] motion-reduce:animate-none" />
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#F3D7CB] bg-[#FAEEE5] px-5 py-4">
              <p className="text-base font-bold text-[#B24832]">{error}</p>
              <button type="button" onClick={() => void dispatch(fetchEmployeeProfile())} className={`min-h-10 rounded-xl bg-[#C87961] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 ${focusRing}`}>
                Try again
              </button>
            </div>
          )}

          {data && <>
            {/* Profile summary (picture, name, quick facts) */}
            <section aria-label="Profile summary" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5D6953] to-[#414B3A] p-5 text-white shadow-md sm:p-7">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <span className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/[0.06]" />
                <span className="absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-[#C87961]/15" />
                <span className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/[0.04]" />
              </div>

              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between xl:gap-10">
                <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                  <div className="relative shrink-0">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white/25 bg-[#F6F8F3] text-2xl font-black text-[#46513F] shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                      {picture ? <span role="img" aria-label="Profile picture" className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${picture})` }} /> : displayName === 'Your profile' ? <CircleUserRound size={36} /> : displayName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                    </div>
                    <button type="button" title="Upload profile picture" aria-label="Upload profile picture" disabled={pictureLoading} onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#414B3A] bg-white text-[#5D6953] shadow-md transition hover:scale-105 hover:bg-[#F6F8F3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 disabled:opacity-50">
                      <Camera size={16} />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPicture} />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-2xl font-black leading-tight sm:text-3xl">{displayName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-base font-medium text-[#DCE4D5]">{displayValue(data.employee.designation) || 'Employee'}</span>
                      {data.employee.emp_code ? (
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-[#E8EEDF] ring-1 ring-white/20">
                          {displayValue(data.employee.emp_code)}
                        </span>
                      ) : null}
                    </div>
                    {pictureLoading && <p className="mt-2 text-sm text-[#E8EEDF]">Updating picture...</p>}
                    {pictureError && <p role="alert" className="mt-2 text-sm text-[#FEF1EC]">{pictureError}</p>}
                  </div>
                </div>

                <HeroFacts data={data} />
              </div>
            </section>

            {/* Notifications */}
            {notice && (
              <div role="status" className="flex items-center gap-3 rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] px-4 py-3 text-sm font-bold text-[#46513F] sm:text-base">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5D6953] text-white"><Check size={15} /></span>
                {notice}
              </div>
            )}
            {formError && (
              <div role="alert" className="rounded-2xl border border-[#F3D7CB] bg-[#FAEEE5] px-4 py-3 text-sm font-bold text-[#B24832] sm:text-base">{formError}</div>
            )}

            <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">

              {/* Sidebar Navigation */}
              <nav aria-label="Profile sections" className="min-w-0 rounded-2xl border border-[#E5DDCE] bg-white p-2.5 shadow-sm lg:p-3">
                <div className="-m-1 flex gap-1.5 overflow-x-auto p-1 lg:flex-col lg:overflow-visible">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const selected = section.id === active.id;
                    const sectionTheme = sectionThemes[section.id] ?? sectionThemes.personal;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        disabled={editing || submitting}
                        onClick={() => { setActiveId(section.id); setPersonalTab('details'); setNotice(''); setFormError(''); }}
                        aria-current={selected ? 'true' : undefined}
                        className={`flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 lg:w-full ${focusRing} ${
                          selected
                            ? 'border-transparent bg-gradient-to-r from-[#5D6953] to-[#46513F] text-white shadow-md'
                            : 'border-transparent text-stone-600 hover:border-[#E5DDCE] hover:bg-[#F6F8F3] hover:text-[#46513F]'
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          selected
                            ? 'border-white/20 bg-white/15 text-white'
                            : `${sectionTheme.headerBorder} ${sectionTheme.iconBg} ${sectionTheme.iconText}`
                        }`}>
                          <Icon size={17} />
                        </span>
                        <span className="flex-1 whitespace-nowrap">{section.title}</span>
                        {selected && <ChevronRight size={16} className="hidden lg:block" />}
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Main Content Area */}
              <div className={`min-w-0 overflow-hidden rounded-3xl border ${theme.border} bg-white shadow-[0_12px_30px_rgba(72,60,45,0.05)]`}>

                {/* Section Header - Uses Section Theme Colors */}
                <div className={`flex flex-wrap items-center justify-between gap-4 border-b ${theme.headerBorder} ${theme.headerBg} px-5 py-5 sm:px-7 sm:py-6`}>
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${theme.border} ${theme.iconBg} ${theme.iconText} shadow-sm sm:h-14 sm:w-14`}>
                      <active.icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className={`text-xl font-black sm:text-2xl ${theme.text}`}>{active.title}</h2>
                        {active.repeatable && records.length > 0 && (
                          <span className={`rounded-full border ${theme.border} bg-white px-2.5 py-0.5 text-xs font-bold ${theme.text}`}>
                            {records.length} {records.length === 1 ? 'entry' : 'entries'}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-stone-600 sm:text-base">{active.description}</p>
                    </div>
                  </div>
                  {!editing && active.request && active.id !== 'personal' && (active.repeatable || records.length === 0) && (
                    <button type="button" disabled={sectionLoading || submitting} onClick={() => startEditing(null)} className={`inline-flex h-10 items-center gap-2 rounded-xl bg-[#C87961] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:opacity-50 ${focusRing}`}>
                      <Plus size={16} /> Add details
                    </button>
                  )}
                </div>

                {active.id === 'personal' && !editing && (
                  <div className="flex flex-wrap gap-2 border-b border-[#EDD7BE] bg-white px-5 py-3 sm:px-7">
                    <button type="button" aria-pressed={personalTab === 'details'} onClick={() => setPersonalTab('details')} className={`rounded-lg px-3 py-2 text-sm font-bold ${personalTab === 'details' ? 'bg-[#FDF8F0] text-[#815526]' : 'text-stone-600 hover:bg-[#F6F8F3]'} ${focusRing}`}>Details</button>
                    <button type="button" aria-pressed={personalTab === 'pending'} onClick={() => setPersonalTab('pending')} className={`rounded-lg px-3 py-2 text-sm font-bold ${personalTab === 'pending' ? 'bg-[#FDF8F0] text-[#815526]' : 'text-stone-600 hover:bg-[#F6F8F3]'} ${focusRing}`}>Pending requests ({pending.length})</button>
                  </div>
                )}

                {/* Loading/Error States */}
                {active.api && sectionLoading && (
                  <p role="status" className="flex items-center gap-2 px-5 pt-5 text-sm font-bold text-[#5D6953] sm:px-7 sm:text-base">
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-[#5D6953]/30 border-t-[#5D6953] motion-reduce:animate-none" />
                    Loading section...
                  </p>
                )}
                {active.api && sectionError && (
                  <p role="alert" className="px-5 pt-5 text-sm font-bold text-[#B24832] sm:px-7 sm:text-base">
                    {sectionError} <button type="button" onClick={() => active.api && void dispatch(fetchProfileSection(active.api))} className={`underline underline-offset-2 hover:text-[#8F3622] ${focusRing}`}>Try again</button>
                  </p>
                )}

                {/* Edit Form */}
                {editing ? (
                  <form onSubmit={submit} className={theme.bg}>
                    <div className="px-5 pt-5 sm:px-7 sm:pt-6">
                      <p className={`inline-flex items-center gap-2 rounded-full border ${theme.headerBorder} bg-white/80 px-3 py-1 text-xs font-bold ${theme.text}`}>
                        {original ? <Pencil size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
                        {original ? 'Editing details' : 'Adding details'}
                      </p>
                    </div>
                    <div className="grid gap-x-5 gap-y-5 px-5 pb-6 pt-4 sm:grid-cols-2 sm:px-7 sm:pb-7 xl:grid-cols-3">
                      {editFields.map((field) => (
                        <label key={field.key} className={`block text-sm font-bold text-stone-700 ${field.wide ? 'sm:col-span-2' : ''}`}>
                          {field.label}
                          {field.options ? (
                            <select value={draft[field.key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} className={inputClass}>
                              <option value="">Select {field.label.toLowerCase()}</option>
                              {draft[field.key] && !field.options.includes(draft[field.key]) && <option value={draft[field.key]}>{draft[field.key]}</option>}
                              {field.options.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
                            </select>
                          ) : (
                            <input type={field.type || 'text'} step={field.type === 'number' ? (field.key === 'retirement_age' ? '1' : 'any') : undefined} min={field.type === 'number' ? 0 : undefined} value={draft[field.key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} className={inputClass} />
                          )}
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DDCE] bg-white/60 px-5 py-4 sm:px-7">
                      <p className="flex items-center gap-2 text-sm font-medium text-stone-600">
                        <Info size={16} className="shrink-0 text-[#707C65]" aria-hidden="true" />
                        Changes are subject to approval.
                      </p>
                      <div className="flex w-full gap-2 sm:w-auto">
                        <button type="button" disabled={submitting} onClick={() => { setEditing(false); setFormError(''); }} className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#E5DDCE] bg-white px-4 text-sm font-bold text-stone-700 transition hover:bg-[#F6F8F3] disabled:opacity-50 sm:flex-none ${focusRing}`}>
                          <X size={16} /> Cancel
                        </button>
                        <button type="submit" disabled={submitting} className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#C87961] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:opacity-50 sm:flex-none ${focusRing}`}>
                          <Save size={16} /> {submitting ? 'Submitting...' : active.id === 'personal' ? 'Save changes' : 'Submit request'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : active.id !== 'personal' || personalTab === 'details' ? (
                  /* Data Display */
                  <div className={`px-5 py-5 sm:px-7 sm:py-7 ${theme.bg}`}>
                    {!active.request && (
                      <p className={`mb-5 flex items-start gap-2.5 rounded-xl border ${theme.headerBorder} bg-white/70 px-4 py-3 text-sm font-medium text-stone-600`}>
                        <Info size={16} className={`mt-0.5 shrink-0 ${theme.iconText}`} aria-hidden="true" />
                        Contact your administrator to update these details.
                      </p>
                    )}
                    {records.length === 0 ? (
                      <div className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed ${theme.border} bg-white/60 px-6 py-10 text-center`}>
                        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.iconBg} ${theme.iconText}`}>
                          <active.icon size={24} />
                        </span>
                        <p className="text-base font-bold text-stone-700">No details available.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {records.map((record, index) => (
                          <div key={String(record.id ?? index)} className={active.repeatable ? `rounded-2xl border ${theme.border} bg-white/50 p-4 sm:p-5` : ''}>
                            {(active.repeatable || active.request) && (
                              <div className="mb-4 flex items-center justify-between gap-3">
                                {active.repeatable ? (
                                  <h3 className={`text-base font-black ${theme.text}`}>{active.title} {index + 1}</h3>
                                ) : <span />}
                                {active.request && (
                                  <div className="flex gap-1.5">
                                    {active.allowUpdate && (
                                      <button type="button" disabled={submitting || sectionLoading} onClick={() => startEditing(record)} title="Edit details" aria-label={`Edit ${active.title} ${index + 1}`} className={`flex h-9 w-9 items-center justify-center rounded-lg border ${theme.headerBorder} bg-white ${theme.iconText} shadow-sm transition hover:bg-[#F6F8F3] active:scale-95 disabled:opacity-50 ${focusRing}`}>
                                        <Pencil size={16} />
                                      </button>
                                    )}
                                    {active.allowDelete && (
                                      <button type="button" disabled={submitting || sectionLoading} onClick={() => void removeRecord(record)} title="Request deletion" aria-label={`Request deletion of ${active.title} ${index + 1}`} className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5DDCE] bg-white text-stone-500 shadow-sm transition hover:border-[#F4C8B9] hover:bg-[#FEF1EC] hover:text-[#C85D44] active:scale-95 disabled:opacity-50 ${focusRing}`}>
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {active.fields.map((field) => (
                                <div key={field.key} className={`min-w-0 rounded-xl border ${theme.headerBorder} bg-white/85 px-4 py-3 shadow-sm ${field.wide ? 'sm:col-span-2' : ''}`}>
                                  <p className={`text-[13px] font-bold ${theme.text}`}>{field.label}</p>
                                  <p className="mt-1 min-h-6 break-words text-[15px] font-semibold text-stone-900">
                                    {displayValue(record[field.key], field) || <span className="font-normal text-stone-500">Not provided</span>}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Pending Requests */}
                {!editing && ((active.id === 'personal' && personalTab === 'pending') || (active.id !== 'personal' && pending.length > 0)) && (
                  <div className="border-t border-[#EDD7BE] bg-[#FDF8F0] px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex items-center gap-2.5">
                      <Clock size={18} className="text-[#9B6A38]" aria-hidden="true" />
                      <h3 className="text-base font-black text-stone-900">Pending requests</h3>
                      <span className="rounded-full bg-[#815526] px-2 py-0.5 text-xs font-black tabular-nums text-white">{pending.length}</span>
                    </div>
                    {active.id === 'personal' && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-stone-600">Only pending requests are available here. Your profile changes after admin approval.</p>
                        <button type="button" onClick={() => void dispatch(fetchEmployeeProfile())} className={`text-sm font-bold text-[#815526] underline underline-offset-2 ${focusRing}`}>Refresh status</button>
                      </div>
                    )}
                    {pending.length === 0 && <p className="mt-4 text-sm text-stone-600">No pending personal details requests.</p>}
                    <div className="mt-4 space-y-3">
                      {pending.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-[#EDD7BE] bg-white px-4 py-3.5 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-black text-[#815526]">{item.request_type} request</span>
                            <span className="rounded-full border border-[#EDD7BE] bg-[#FDF8F0] px-2.5 py-0.5 text-xs font-bold text-[#815526]">{item.status}</span>
                          </div>
                          {item.created_at && !Number.isNaN(Date.parse(item.created_at)) && <p className="mt-2 text-xs text-stone-500">Submitted {new Date(item.created_at).toLocaleString('en-IN')}</p>}
                          {item.requested_data && (
                            <dl className="mt-3 grid gap-3 border-t border-[#F3E6D3] pt-3 sm:grid-cols-2 xl:grid-cols-3">
                              {Object.entries(item.requested_data).filter(([key, value]) => active.id !== 'personal' || !item.existing_data || !valuesMatch(item.existing_data[key], value, active.fields.find((field) => field.key === key))).map(([key, value]) => (
                                <div key={key} className="min-w-0 text-sm">
                                  <dt className="text-stone-600">{active.fields.find((field) => field.key === key)?.label || key.replaceAll('_', ' ')}</dt>
                                  {active.id === 'personal' && item.existing_data && <dd className="mt-0.5 break-words text-stone-500">Current: {displayValue(item.existing_data[key], active.fields.find((field) => field.key === key)) || 'Not provided'}</dd>}
                                  <dd className="mt-0.5 break-words font-semibold text-stone-800">{displayValue(value, active.fields.find((field) => field.key === key)) || 'Not provided'}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>}
        </main>
      </div>
    </div>
  );
}