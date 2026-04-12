export interface FileMetadata {
  id: string;
  name: string;
  custom_name?: string;
  instructions?: string;
  size: number;
  url: string;
  created_at: string;
  type: string;
  category: string;
  is_link?: boolean;
}
