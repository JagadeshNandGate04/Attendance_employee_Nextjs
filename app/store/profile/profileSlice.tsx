import { authenticatedFetch } from "../auth/authenticatedFetch";
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { logout } from '../auth/authSlice';

export type ProfileRecord = Record<string, string | number | boolean | null>;
export interface ProfileRequest {
	id: string;
	section?: string;
	record_id: string | null;
	request_type: 'CREATE' | 'UPDATE' | 'DELETE';
	existing_data?: ProfileRecord;
	requested_data?: ProfileRecord;
	status: string;
	created_at: string;
	approval_remarks?: string | null;
	employee_name?: string;
	emp_code?: string;
	designation?: string;
}
export interface EmployeeProfile {
	employee: ProfileRecord;
	profile: ProfileRecord & { profile_picture?: { available: boolean; mime_type: string | null; size_bytes: number | null } };
	addresses: ProfileRecord[];
	emergency_contacts: ProfileRecord[];
	family_members: ProfileRecord[];
	qualifications: ProfileRecord[];
	work_experiences: ProfileRecord[];
	identity_details: ProfileRecord | null;
	statutory_details: ProfileRecord | null;
	bank_details: ProfileRecord | null;
	documents: ProfileRecord[];
	pending_requests: ProfileRequest[];
}
export type ProfileSection = 'addresses' | 'emergency-contacts' | 'family-members' | 'qualifications' | 'work-experiences';
export type RequestSection = ProfileSection | 'identity-details' | 'personal-details';
export interface SectionData {
	addresses?: ProfileRecord[];
	contacts?: ProfileRecord[];
	family_members?: ProfileRecord[];
	qualifications?: ProfileRecord[];
	experiences?: ProfileRecord[];
	pending_requests: ProfileRequest[];
}
export type RequestPayload = Record<string, string | number | boolean | null>;
export interface AdminFilters {
	status?: string;
	section?: string;
	user_id?: string;
	emp_code?: string;
	request_type?: string;
	from_date?: string;
	to_date?: string;
	page?: number;
	limit?: number;
}
interface ApiResponse<T> { success: boolean; message?: string; data?: T }
interface ProfileState {
	data: EmployeeProfile | null;
	sections: Partial<Record<ProfileSection, SectionData>>;
	loading: boolean;
	sectionLoading: Partial<Record<ProfileSection, boolean>>;
	sectionRequestIds: Partial<Record<ProfileSection, string>>;
	submitting: boolean;
	pictureLoading: boolean;
	picture: string | null;
	profileRequestId: string | null;
	pictureRequestId: string | null;
	error: string | null;
	sectionError: Partial<Record<ProfileSection, string | null>>;
	submitError: string | null;
	pictureError: string | null;
}

const initialState: ProfileState = {
	data: null, sections: {}, loading: false, sectionLoading: {}, sectionRequestIds: {}, submitting: false,
	pictureLoading: false, picture: null, profileRequestId: null, pictureRequestId: null, error: null, sectionError: {}, submitError: null, pictureError: null,
};
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const BASE_PATH = '/api/v1/employee-profile';

function authHeaders(): HeadersInit {
	if (typeof window === 'undefined') throw new Error('Profile requests require a browser session.');
	const token = localStorage.getItem('token');
	if (!token) throw new Error('Authentication token not found. Please login again.');
	return { Accept: 'application/json', Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await authenticatedFetch(`${API_BASE_URL}${BASE_PATH}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } });
	let result: ApiResponse<T>;
	try { result = await response.json() as ApiResponse<T>; }
	catch { throw new Error(`Profile request failed (${response.status}).`); }
	if (!response.ok || !result.success || !result.data) throw new Error(result.message || `Profile request failed (${response.status}).`);
	return result.data;
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Unable to process profile request.';

export const fetchEmployeeProfile = createAsyncThunk<EmployeeProfile, void, { rejectValue: string }>(
	'profile/fetchEmployeeProfile', async (_, { rejectWithValue }) => {
		try { return await request<EmployeeProfile>('/me'); } catch (error) { return rejectWithValue(errorMessage(error)); }
	}
);

export const fetchProfileSection = createAsyncThunk<{ section: ProfileSection; data: SectionData }, ProfileSection, { rejectValue: string }>(
	'profile/fetchSection', async (section, { rejectWithValue }) => {
		try { return { section, data: await request<SectionData>(`/me/${section}`) }; } catch (error) { return rejectWithValue(errorMessage(error)); }
	}
);

export const submitProfileRequest = createAsyncThunk<{ request?: ProfileRequest }, { section: RequestSection; payload: RequestPayload }, { rejectValue: string }>(
	'profile/submitRequest', async ({ section, payload }, { rejectWithValue }) => {
		try { return await request<{ request?: ProfileRequest }>(`/me/${section}/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); }
		catch (error) { return rejectWithValue(errorMessage(error)); }
	}
);

export const fetchProfilePicture = createAsyncThunk<string, void, { rejectValue: string }>(
	'profile/fetchPicture', async (_, { rejectWithValue }) => {
		try {
			const response = await authenticatedFetch(`${API_BASE_URL}${BASE_PATH}/me/profile-picture`, { headers: authHeaders() });
			if (!response.ok) {
				const result = await response.json().catch(() => null) as ApiResponse<unknown> | null;
				throw new Error(result?.message || `Unable to load profile picture (${response.status}).`);
			}
			const blob = await response.blob();
			if (!blob.type.startsWith('image/')) throw new Error('The profile picture response is not an image.');
			return await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(String(reader.result));
				reader.onerror = () => reject(new Error('Unable to read profile picture.'));
				reader.readAsDataURL(blob);
			});
		} catch (error) { return rejectWithValue(errorMessage(error)); }
	}
);

export const uploadProfilePicture = createAsyncThunk<void, File, { rejectValue: string }>(
	'profile/uploadPicture', async (file, { rejectWithValue }) => {
		try { const form = new FormData(); form.append('profile_picture', file); await request<unknown>('/me/profile-picture', { method: 'POST', body: form }); }
		catch (error) { return rejectWithValue(errorMessage(error)); }
	}
);

export const fetchAdminProfileRequests = createAsyncThunk<{ requests: ProfileRequest[]; pagination: { page: number; limit: number; total: number; total_pages: number } }, AdminFilters, { rejectValue: string }>(
	'profile/fetchAdminRequests', async (filters, { rejectWithValue }) => {
		try {
			const query = new URLSearchParams();
			Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
			return await request(`/admin/requests${query.size ? `?${query}` : ''}`);
		} catch (error) { return rejectWithValue(errorMessage(error)); }
	}
);

export const fetchAdminProfileRequest = createAsyncThunk<{ request: ProfileRequest }, string, { rejectValue: string }>(
	'profile/fetchAdminRequest', async (id, { rejectWithValue }) => {
		try { return await request(`/admin/requests/${encodeURIComponent(id)}`); } catch (error) { return rejectWithValue(errorMessage(error)); }
	}
);

export const reviewProfileRequest = createAsyncThunk<unknown, { id: string; decision: 'approve' | 'reject'; remarks: string; address?: boolean }, { rejectValue: string }>(
	'profile/reviewRequest', async ({ id, decision, remarks, address }, { rejectWithValue }) => {
		try { return await request(`/admin/requests/${encodeURIComponent(id)}${address ? '/address' : ''}/${decision}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approval_remarks: remarks }) }); }
		catch (error) { return rejectWithValue(errorMessage(error)); }
	}
);

const profileSlice = createSlice({
	name: 'profile', initialState, reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(logout, () => initialState)
			.addCase(fetchEmployeeProfile.pending, (state, action) => { state.loading = true; state.error = null; state.data = null; state.picture = null; state.pictureLoading = false; state.pictureError = null; state.sections = {}; state.sectionLoading = {}; state.sectionError = {}; state.sectionRequestIds = {}; state.profileRequestId = action.meta.requestId; state.pictureRequestId = null; })
			.addCase(fetchEmployeeProfile.fulfilled, (state, action) => { if (state.profileRequestId !== action.meta.requestId) return; state.loading = false; state.data = action.payload; state.sections = {}; })
			.addCase(fetchEmployeeProfile.rejected, (state, action) => { if (state.profileRequestId !== action.meta.requestId) return; state.loading = false; state.error = action.payload || 'Unable to load profile.'; })
			.addCase(fetchProfileSection.pending, (state, action) => { state.sectionLoading[action.meta.arg] = true; state.sectionError[action.meta.arg] = null; state.sectionRequestIds[action.meta.arg] = action.meta.requestId; })
			.addCase(fetchProfileSection.fulfilled, (state, action) => { const section = action.meta.arg; if (state.sectionRequestIds[section] !== action.meta.requestId) return; state.sectionLoading[section] = false; state.sections[section] = action.payload.data; })
			.addCase(fetchProfileSection.rejected, (state, action) => { const section = action.meta.arg; if (state.sectionRequestIds[section] !== action.meta.requestId) return; state.sectionLoading[section] = false; state.sectionError[section] = action.payload || 'Unable to load section.'; })
			.addCase(submitProfileRequest.pending, (state) => { state.submitting = true; state.submitError = null; })
			.addCase(submitProfileRequest.fulfilled, (state, action) => {
				state.submitting = false;
				if (action.meta.arg.section === 'personal-details' && action.payload.request && state.data) {
					const submitted = action.payload.request;
					state.data.pending_requests = [submitted, ...(state.data.pending_requests ?? []).filter((item) => item.id !== submitted.id)];
				}
			})
			.addCase(submitProfileRequest.rejected, (state, action) => { state.submitting = false; state.submitError = action.payload || 'Unable to submit request.'; })
			.addCase(fetchProfilePicture.pending, (state, action) => { state.pictureLoading = true; state.pictureError = null; state.pictureRequestId = action.meta.requestId; })
			.addCase(fetchProfilePicture.fulfilled, (state, action) => { if (state.pictureRequestId !== action.meta.requestId) return; state.pictureLoading = false; state.picture = action.payload; })
			.addCase(fetchProfilePicture.rejected, (state, action) => { if (state.pictureRequestId !== action.meta.requestId) return; state.pictureLoading = false; state.pictureError = action.payload || 'Unable to load picture.'; })
			.addCase(uploadProfilePicture.pending, (state) => { state.pictureLoading = true; state.pictureError = null; })
			.addCase(uploadProfilePicture.fulfilled, (state) => { state.pictureLoading = false; })
			.addCase(uploadProfilePicture.rejected, (state, action) => { state.pictureLoading = false; state.pictureError = action.payload || 'Unable to upload picture.'; });
	},
});

export default profileSlice.reducer;
