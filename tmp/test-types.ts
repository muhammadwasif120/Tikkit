import { Database } from '../src/lib/supabase/database.types';

type PublicSchema = Database['public'];

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

type CheckTable<T> = T extends GenericTable ? true : false;

const isProfiles: CheckTable<PublicSchema['Tables']['profiles']> = true;
const isEvents: CheckTable<PublicSchema['Tables']['events']> = true;
const isEventPasses: CheckTable<PublicSchema['Tables']['event_passes']> = true;
const isGuests: CheckTable<PublicSchema['Tables']['guests']> = true;
const isNotifications: CheckTable<PublicSchema['Tables']['notifications']> = true;
const isCreditTx: CheckTable<PublicSchema['Tables']['credit_transactions']> = true;
const isVendorInvoices: CheckTable<PublicSchema['Tables']['vendor_invoices']> = true;
