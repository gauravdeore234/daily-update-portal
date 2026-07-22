export type Team = { id: string; name: string; sort_order: number };
export type Member = { id: string; team_id: string; name: string; active: boolean };
export type UpdateRow = {
  id: string;
  member_id: string;
  team_id: string;
  member_name: string;
  date_key: string;
  body: string;
  updated_at: string;
};
export type Status = {
  dateLabel: string;
  istTime: string;
  isOpen: boolean;
  cutoffHour: number;
};
