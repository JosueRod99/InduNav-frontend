import apiClient from './client';

// "Idiomas" (platform only)

export interface CatalogLanguage {
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  is_built_in: boolean; // Spanish and English: their fixed texts are in code
  ui_texts: Record<string, string>; // fixed texts of the viewer, the rest
  organizations_count: number;
  tours_count: number;
}

export interface LanguageInput {
  code: string;
  name: string;
  native_name: string;
}

export interface OrganizationLanguages {
  id: string;
  name: string;
  is_active: boolean;
  default_language: string;
  languages: string[];
}

export const getLanguages = async (): Promise<CatalogLanguage[]> => (await apiClient.get('/languages')).data.languages;

export const createLanguage = async (input: LanguageInput): Promise<void> => {
  await apiClient.post('/languages', input);
};

export const updateLanguage = async (code: string, input: Partial<Omit<LanguageInput, 'code'>> & { is_active?: boolean; ui_texts?: Record<string, string> }): Promise<void> => {
  await apiClient.patch(`/languages/${code}`, input);
};

export const deleteLanguage = async (code: string): Promise<void> => {
  await apiClient.delete(`/languages/${code}`);
};

export const getOrganizationLanguages = async (): Promise<OrganizationLanguages[]> =>
  (await apiClient.get('/languages/organizations')).data.organizations;

export const setOrganizationLanguages = async (organizationId: string, languages: string[]): Promise<void> => {
  await apiClient.put(`/languages/organizations/${organizationId}`, { languages });
};
