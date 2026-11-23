'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BriefcaseBusiness, CalendarDays, Camera, Check, ChevronRight, CircleUserRound,
  ContactRound, CreditCard, FileText, GraduationCap, MapPin, Pencil, Plus,
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
  { id: 'personal', title: 'Personal details', description: 'Your basic information and identity.', icon: CircleUserRound, fields: [
    { key: 'name', label: 'Full name' }, { key: 'date_of_birth', label: 'Date of birth', type: 'date' },
    { key: 'marital_status', label: 'Marital status' }, { key: 'father_spouse_name', label: 'Father or spouse name' },
    { key: 'religion', label: 'Religion' }, { key: 'caste', label: 'Caste' }, { key: 'mother_tongue', label: 'Mother tongue' },
    { key: 'city_of_birth', label: 'City of birth' }, { key: 'country_of_birth', label: 'Country of birth' },
    { key: 'nationality', label: 'Nationality' }, { key: 'community', label: 'Community' },
    { key: 'blood_group', label: 'Blood group' }, { key: 'height_cm', label: 'Height (cm)' }, { key: 'weight_kg', label: 'Weight (kg)' },
    { key: 'highest_qualification_level', label: 'Highest qualification' }, { key: 'retirement_age', label: 'Retirement age' },
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

const inputClass = 'mt-2 block h-12 w-full min-w-0 rounded-xl border border-[#E5DDCE] bg-[#FCFAF7] px-4 text-base font-medium text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#707C65] focus:ring-2 focus:ring-[#707C65]/20';

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

// Distinct Color Themes for each section
const sectionThemes: Record<string, { bg: string; border: string; text: string; iconBg: string; iconText: string; headerBg: string; headerBorder: string }> = {
  personal:   { bg: 'bg-gradient-to-br from-[#FFFDF8] to-[#F8EBD9]', border: 'border-[#E8D4B9]', text: 'text-[#815526]', iconBg: 'bg-[#FDF8F0]', iconText: 'text-[#9B6A38]', headerBg: 'bg-[#FDF8F0]', headerBorder: 'border-[#EDD7BE]' },
  employment: { bg: 'bg-gradient-to-br from-[#F6F8F3] to-[#EAF0E6]', border: 'border-[#D9E2D2]', text: 'text-[#46513F]', iconBg: 'bg-[#EAF0E6]', iconText: 'text-[#5D6953]', headerBg: 'bg-[#F6F8F3]', headerBorder: 'border-[#D9E2D2]' },
  contact:    { bg: 'bg-gradient-to-br from-[#FFF8F5] to-[#FCE5DC]', border: 'border-[#F3C9BB]', text: 'text-[#B24832]', iconBg: 'bg-[#FEF1EC]', iconText: 'text-[#C85D44]', headerBg: 'bg-[#FEF1EC]', headerBorder: 'border-[#F4C8B9]' },
  addresses:  { bg: 'bg-gradient-to-br from-[#FFFDF8] to-[#F8EBD9]', border: 'border-[#E8D4B9]', text: 'text-[#815526]', iconBg: 'bg-[#FDF8F0]', iconText: 'text-[#9B6A38]', headerBg: 'bg-[#FDF8F0]', headerBorder: 'border-[#EDD7BE]' },
  emergency:  { bg: 'bg-gradient-to-br from-[#FFF8F5] to-[#FCE5DC]', border: 'border-[#F3C9BB]', text: 'text-[#B24832]', iconBg: 'bg-[#FEF1EC]', iconText: 'text-[#C85D44]', headerBg: 'bg-[#FEF1EC]', headerBorder: 'border-[#F4C8B9]' },
  family:     { bg: 'bg-gradient-to-br from-[#F6F8F3] to-[#EAF0E6]', border: 'border-[#D9E2D2]', text: 'text-[#46513F]', iconBg: 'bg-[#EAF0E6]', iconText: 'text-[#5D6953]', headerBg: 'bg-[#F6F8F3]', headerBorder: 'border-[#D9E2D2]' },
  education:  { bg: 'bg-gradient-to-br from-[#FFFDF8] to-[#F8EBD9]', border: 'border-[#E8D4B9]', text: 'text-[#815526]', iconBg: 'bg-[#FDF8F0]', iconText: 'text-[#9B6A38]', headerBg: 'bg-[#FDF8F0]', headerBorder: 'border-[#EDD7BE]' },
  identity:   { bg: 'bg-gradient-to-br from-[#FFF8F5] to-[#FCE5DC]', border: 'border-[#F3C9BB]', text: 'text-[#B24832]', iconBg: 'bg-[#FEF1EC]', iconText: 'text-[#C85D44]', headerBg: 'bg-[#FEF1EC]', headerBorder: 'border-[#F4C8B9]' },
  bank:       { bg: 'bg-gradient-to-br from-[#F6F8F3] to-[#EAF0E6]', border: 'border-[#D9E2D2]', text: 'text-[#46513F]', iconBg: 'bg-[#EAF0E6]', iconText: 'text-[#5D6953]', headerBg: 'bg-[#F6F8F3]', headerBorder: 'border-[#D9E2D2]' },
  experience: { bg: 'bg-gradient-to-br from-[#FFFDF8] to-[#F8EBD9]', border: 'border-[#E8D4B9]', text: 'text-[#815526]', iconBg: 'bg-[#FDF8F0]', iconText: 'text-[#9B6A38]', headerBg: 'bg-[#FDF8F0]', headerBorder: 'border-[#EDD7BE]' },
};

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { data, loading, error, sectionLoading: loadingSections, sectionError: sectionErrors, submitting, picture, pictureLoading, pictureError } = useAppSelector((state) => state.profile);
  const [activeId, setActiveId] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [original, setOriginal] = useState<ProfileRecord | null>(null);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
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
  const displayName = displayValue(data?.employee?.name) || 'Your profile';

  function startEditing(record: ProfileRecord | null) {
    const values: Draft = {};
    active.fields.forEach((field) => { values[field.key] = displayValue(record?.[field.key], field); });
    if (!record && active.id === 'family') values.family_member_type = 'FAMILY_MEMBER';
    if (!record && active.id === 'education') values.qualification_type = 'ACADEMIC';
    if (!record && active.id === 'emergency') values.is_primary = 'Yes';
    setDraft(values); setOriginal(record); setFormError(''); setNotice(''); setEditing(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active.request) return;
    const payload: RequestPayload = {};
    if (active.request !== 'addresses') payload.request_type = original ? 'UPDATE' : 'CREATE';
    if (original && active.request !== 'addresses') {
      if (original.id == null) { setFormError('This record cannot be updated because its ID is missing.'); return; }
      payload.id = original.id;
    }
    for (const field of active.fields) {
      const value = draft[field.key] ?? '';
      if (original && active.request !== 'addresses' && value === displayValue(original[field.key], field)) continue;
      if (field.key === 'is_primary') payload[field.key] = value === 'Yes';
      else if (field.type === 'number') payload[field.key] = value === '' ? null : Number(value);
      else payload[field.key] = value;
    }
    if (active.request === 'addresses' && !payload.address_type) { setFormError('Select an address type.'); return; }
    if (Object.keys(payload).length <= (original && active.request !== 'addresses' ? 2 : 1)) { setFormError('Enter at least one change.'); return; }
    try {
      await dispatch(submitProfileRequest({ section: active.request, payload })).unwrap();
      setEditing(false); setNotice('Your change request has been submitted for approval.'); setFormError('');
      if (active.api) await dispatch(fetchProfileSection(active.api));
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
      <main className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] border border-[#ECE3D3]/80 bg-[#FCFAF7] p-4 shadow-[0_24px_64px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:rounded-[42px] sm:p-6 lg:p-8">
        <TopNav />
        
        {/* Header Bar */}
        <div className="mt-2 flex flex-col justify-between gap-4 border-b border-[#ECE3D3] pb-4 md:flex-row md:items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#5D6953]">EMPLOYEE ACCOUNT</span>
            <h1 className="mt-0.5 text-3xl font-black text-stone-900 sm:text-4xl">My Profile</h1>
            <p className="mt-1 text-sm leading-relaxed text-stone-600 sm:text-base">
              Your personal and employment information, all in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             {data && (
               <span className="rounded-xl border border-[#E5DDCE] bg-[#F7F3EB] px-4 py-2 text-sm font-bold text-[#46513F]">
                {displayName}
              </span>
             )}
          </div>
        </div>

        {loading && <p role="status" className="mt-6 text-base font-bold text-[#5D6953] animate-pulse">Loading profile...</p>}
        {error && <div role="alert" className="mt-6 rounded-xl border border-[#F3D7CB] bg-[#FAEEE5] p-4 text-base font-bold text-[#C85D44]">{error} <button type="button" onClick={() => void dispatch(fetchEmployeeProfile())} className="ml-2 underline">Try again</button></div>}
        
        {data && <>
          {/* Header Card (Profile Picture & Name) */}
          <div className="flex flex-wrap items-center gap-5 rounded-[28px] bg-gradient-to-br from-[#5D6953] to-[#414B3A] px-6 py-6 text-white shadow-md sm:px-8">
            <div className="relative">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-[#F6F8F3] text-2xl font-black text-[#46513F]">
                {picture ? <span role="img" aria-label="Profile picture" className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${picture})` }} /> : displayName === 'Your profile' ? <CircleUserRound size={32} /> : displayName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
              </div>
              <button type="button" title="Upload profile picture" aria-label="Upload profile picture" disabled={pictureLoading} onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 rounded-full border-2 border-[#414B3A] bg-white p-2 text-[#5D6953] shadow-sm transition hover:bg-[#F6F8F3] active:scale-95 disabled:opacity-50">
                <Camera size={16} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPicture} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-xl font-black sm:text-2xl">{displayName}</p>
              <p className="mt-1 text-base font-medium text-[#DCE4D5]">{displayValue(data.employee.designation) || 'Employee'}{data.employee.emp_code ? `  ·  ${data.employee.emp_code}` : ''}</p>
              {pictureLoading && <p className="mt-1 text-sm text-[#E8EEDF]">Updating picture...</p>}
              {pictureError && <p role="alert" className="mt-1 text-sm text-[#FEF1EC]">{pictureError}</p>}
            </div>
          </div>

          {/* Notifications */}
          {notice && <div role="status" className="mt-5 flex items-center gap-2 rounded-lg border border-[#D9E2D2] bg-[#F6F8F3] px-4 py-3 text-sm font-bold text-[#5D6953]"><Check size={17} />{notice}</div>}
          {formError && <div role="alert" className="mt-5 rounded-lg border border-[#F4C8B9] bg-[#FEF1EC] px-4 py-3 text-sm font-bold text-[#C85D44]">{formError}</div>}
          
          <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            
            {/* Sidebar Navigation */}
            <nav aria-label="Profile sections" className="min-w-0 rounded-2xl border border-[#E5DDCE] bg-white p-3 shadow-sm">
              <p className="mb-2 hidden px-3 pt-2 text-xs font-black uppercase tracking-widest text-[#5D6953] lg:block">Profile Sections</p>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const selected = section.id === active.id;
                  return (
                    <button 
                      key={section.id} 
                      type="button" 
                      disabled={editing || submitting} 
                      onClick={() => { setActiveId(section.id); setNotice(''); setFormError(''); }} 
                      aria-current={selected ? 'page' : undefined} 
                      className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all duration-200 disabled:opacity-50 lg:w-full ${
                        selected 
                          ? 'bg-gradient-to-r from-[#5D6953] to-[#46513F] text-white shadow-md' 
                          : 'text-stone-600 hover:bg-[#F6F8F3] hover:text-[#46513F] border border-transparent hover:border-[#E5DDCE]'
                      }`}
                    >
                      <Icon size={19} className="shrink-0" />
                      <span className="flex-1 whitespace-nowrap">{section.title}</span>
                      {selected && <ChevronRight size={16} className="hidden lg:block" />}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Main Content Area */}
            <div className={`min-w-0 overflow-hidden rounded-[28px] border ${theme.border} bg-white shadow-[0_12px_30px_rgba(72,60,45,0.05)]`}>
              
              {/* Section Header - Uses Section Theme Colors */}
              <div className={`flex flex-wrap items-start justify-between gap-4 border-b ${theme.headerBorder} ${theme.headerBg} px-5 py-5 sm:px-8 sm:py-7`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.iconText} shadow-sm border ${theme.border}`}>
                    <active.icon size={23} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-black sm:text-2xl ${theme.text}`}>{active.title}</h2>
                    <p className="mt-1 text-base text-stone-600">{active.description}</p>
                  </div>
                </div>
                {!editing && active.request && (active.repeatable || records.length === 0) && (
                  <button type="button" disabled={sectionLoading || submitting} onClick={() => startEditing(null)} className="inline-flex items-center gap-2 rounded-xl bg-[#C87961] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:opacity-50">
                    <Plus size={16} /> Add details
                  </button>
                )}
              </div>

              {/* Loading/Error States */}
              {active.api && sectionLoading && <p role="status" className="px-5 pt-5 text-base font-bold text-[#5D6953] animate-pulse sm:px-8">Loading section...</p>}
              {active.api && sectionError && <p role="alert" className="px-5 pt-5 text-base font-bold text-[#C85D44] sm:px-8">{sectionError} <button type="button" onClick={() => active.api && void dispatch(fetchProfileSection(active.api))} className="underline">Try again</button></p>}

              {/* Edit Form */}
              {editing ? (
                <form onSubmit={submit} className={theme.bg}>
                  <div className="grid gap-x-6 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-8 sm:py-8">
                    {active.fields.map((field) => (
                      <label key={field.key} className={`block text-sm font-bold text-stone-700 ${field.wide ? 'sm:col-span-2' : ''}`}>
                        {field.label}
                        {field.options ? (
                          <select value={draft[field.key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} className={inputClass}>
                            <option value="">Select {field.label.toLowerCase()}</option>
                            {field.options.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
                          </select>
                        ) : (
                          <input type={field.type || 'text'} value={draft[field.key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} className={inputClass} />
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DDCE] bg-white/50 px-5 py-4 sm:px-8">
                    <p className="text-sm font-medium text-stone-600">Changes are subject to approval.</p>
                    <div className="flex gap-2">
                      <button type="button" disabled={submitting} onClick={() => { setEditing(false); setFormError(''); }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E5DDCE] bg-white px-4 text-sm font-bold text-stone-700 transition hover:bg-[#F6F8F3] disabled:opacity-50">
                        <X size={16} /> Cancel
                      </button>
                      <button type="submit" disabled={submitting} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#C87961] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:opacity-50">
                        <Save size={16} /> {submitting ? 'Submitting...' : 'Submit request'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Data Display */
                <div className={`px-5 py-6 sm:px-8 sm:py-8 ${theme.bg}`}>
                  {records.length === 0 ? (
                    <p className="text-base text-stone-600">No details available.</p>
                  ) : (
                    records.map((record, index) => (
                      <div key={String(record.id ?? index)} className={index > 0 ? `mt-8 border-t ${theme.border} pt-7` : ''}>
                        <div className="mb-5 flex items-center justify-between gap-3">
                          {active.repeatable ? (
                            <h3 className={`text-base font-bold ${theme.text}`}>{active.title} {index + 1}</h3>
                          ) : <span />}
                          {active.request && (
                            <div className="flex gap-2">
                              {active.allowUpdate && (
                                <button type="button" disabled={submitting || sectionLoading} onClick={() => startEditing(record)} title="Edit details" aria-label={`Edit ${active.title} ${index + 1}`} className={`rounded-md p-2 ${theme.iconText} transition hover:bg-white/50 disabled:opacity-50`}>
                                  <Pencil size={17} />
                                </button>
                              )}
                              {active.allowDelete && (
                                <button type="button" disabled={submitting || sectionLoading} onClick={() => void removeRecord(record)} title="Request deletion" aria-label={`Request deletion of ${active.title} ${index + 1}`} className="rounded-md p-2 text-stone-500 transition hover:bg-[#FEF1EC] hover:text-[#C85D44] disabled:opacity-50">
                                  <Trash2 size={17} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {active.fields.map((field) => (
                            <div key={field.key} className={`min-w-0 rounded-xl border ${theme.border} bg-white/80 px-4 py-4 shadow-sm ${field.wide ? 'sm:col-span-2' : ''}`}>
                              <p className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>{field.label}</p>
                              <p className="mt-2 min-h-6 break-words text-base font-semibold text-stone-900">
                                {displayValue(record[field.key], field) || <span className="font-normal text-stone-500">Not provided</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  {!active.request && <p className="mt-7 text-sm font-medium text-stone-600">Contact your administrator to update these details.</p>}
                </div>
              )}

              {/* Pending Requests */}
              {pending.length > 0 && (
                <div className="border-t border-[#E5DDCE] bg-[#FAF7F0] px-5 py-6 sm:px-8">
                  <h3 className="text-base font-bold text-stone-900">Pending requests</h3>
                  <div className="mt-3 space-y-3">
                    {pending.map((item) => (
                      <div key={item.id} className="rounded-xl border border-[#EDD7BE] bg-[#FDF8F0] px-4 py-3">
                        <div className="flex flex-wrap justify-between gap-2 text-sm font-bold text-[#9B6A38]">
                          <span>{item.request_type} request</span>
                          <span>{item.status}</span>
                        </div>
                        {item.requested_data && (
                          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                            {Object.entries(item.requested_data).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <dt className="text-stone-600">{active.fields.find((field) => field.key === key)?.label || key.replaceAll('_', ' ')}</dt>
                                <dd className="mt-1 break-words font-semibold text-stone-800">{displayValue(value, active.fields.find((field) => field.key === key)) || 'Not provided'}</dd>
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
  );
}