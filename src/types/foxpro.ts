export type DBFFieldType =
  | 'C' // Character (string)
  | 'N' // Numeric
  | 'F' // Float
  | 'I' // Integer
  | 'Y' // Currency
  | 'D' // Date (YYYYMMDD)
  | 'T' // DateTime
  | 'L' // Logical (T/F)
  | 'M' // Memo (large text)
  | 'B'; // Blob/Binary

export interface DBFField {
  name: string;
  type: DBFFieldType;
  length: number;
  decimals: number;
  nullable: boolean;
  defaultValue?: string;
  validationRule?: string;
  validationText?: string;
  isPrimaryKey?: boolean;
  indexTag?: string;
}

export interface DBFRecord {
  _recno: number;
  _deleted?: boolean;
  [fieldName: string]: any;
}

export interface DBFIndex {
  tag: string;
  expression: string;
  order: 'ASC' | 'DESC';
  isUnique?: boolean;
}

export interface DBFTable {
  id: string;
  name: string;
  filename: string;
  fields: DBFField[];
  records: DBFRecord[];
  indexes: DBFIndex[];
  activeTag?: string;
  description?: string;
  lastModified?: string;
}

export interface DBFRelation {
  id: string;
  parentTableId: string;
  parentField: string;
  childTableId: string;
  childField: string;
  relationType: '1-1' | '1-N' | 'N-M';
}

export interface DBFDatabase {
  id: string;
  name: string;
  description: string;
  tables: DBFTable[];
  relations: DBFRelation[];
  createdAt: string;
}

export type FormControlType =
  | 'textbox'
  | 'editbox'
  | 'label'
  | 'button'
  | 'checkbox'
  | 'optiongroup'
  | 'combobox'
  | 'listbox'
  | 'grid'
  | 'image'
  | 'shape'
  | 'navgroup'
  | 'datepicker'
  | 'spinner'
  | 'separator';

export interface GridColumn {
  id: string;
  header: string;
  controlSource: string;
  width: number;
  alignment: 'left' | 'center' | 'right';
  readOnly?: boolean;
  format?: string;
}

export interface FormControl {
  id: string;
  name: string;
  type: FormControlType;
  left: number;
  top: number;
  width: number;
  height: number;
  caption?: string;
  controlSource?: string; // Table.Field or variable e.g. "customers.company_name"
  value?: any;
  defaultValue?: string;
  readOnly?: boolean;
  enabled?: boolean;
  visible?: boolean;
  tabIndex?: number;
  // Styling
  backColor?: string;
  foreColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '600';
  alignment?: 'left' | 'center' | 'right';
  borderStyle?: 'none' | 'single' | 'dashed' | 'inset';
  borderRadius?: number;
  toolTipText?: string;
  format?: string; // e.g. "@!" for uppercase, "$999,999.99"
  inputMask?: string;
  // Specific properties
  options?: string[]; // for combobox, optiongroup, listbox
  gridColumns?: GridColumn[]; // for grid control
  gridTableId?: string; // for grid data binding
  imageUrl?: string; // for image control
  shapeType?: 'rectangle' | 'rounded' | 'circle';
  buttonAction?: 'custom' | 'first' | 'prev' | 'next' | 'last' | 'new' | 'delete' | 'save' | 'cancel' | 'search' | 'close' | 'run_query';
  buttonQueryId?: string;
  // Script / Event Code
  events?: {
    click?: string;
    init?: string;
    interactiveChange?: string;
    valid?: string;
    when?: string;
    gotFocus?: string;
    lostFocus?: string;
  };
}

export interface FormDefinition {
  id: string;
  name: string;
  caption: string;
  width: number;
  height: number;
  backColor: string;
  foreColor: string;
  initialTableId?: string;
  controls: FormControl[];
  events?: {
    init?: string;
    load?: string;
    unload?: string;
    destroy?: string;
  };
  description?: string;
  createdDate?: string;
}

export interface QueryJoin {
  id: string;
  leftTableId: string;
  leftField: string;
  rightTableId: string;
  rightField: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS';
}

export interface QuerySelectedField {
  id: string;
  tableId: string;
  fieldName: string;
  alias?: string;
  expression?: string;
  aggregate?: 'NONE' | 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}

export interface QueryCriterion {
  id: string;
  tableId: string;
  field: string;
  operator: '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL';
  value: string;
  value2?: string; // for BETWEEN
  logical: 'AND' | 'OR';
}

export interface QueryOrderBy {
  id: string;
  tableId: string;
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryDefinition {
  id: string;
  name: string;
  description?: string;
  tables: { tableId: string; alias: string; x: number; y: number }[];
  joins: QueryJoin[];
  selectedFields: QuerySelectedField[];
  criteria: QueryCriterion[];
  groupBy: string[];
  having?: string;
  orderBy: QueryOrderBy[];
  limit?: number;
  distinct?: boolean;
  customSql?: string;
}

export interface ReportItem {
  id: string;
  type: 'label' | 'field' | 'line' | 'summary' | 'image';
  text?: string;
  expression?: string; // e.g. "customers.company_name" or "DATE()"
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  alignment?: 'left' | 'center' | 'right';
  foreColor?: string;
  format?: string;
  summaryType?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
}

export interface ReportBand {
  id: string;
  name: string;
  type: 'title' | 'pageHeader' | 'groupHeader' | 'detail' | 'groupFooter' | 'pageFooter' | 'summary';
  height: number;
  items: ReportItem[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  title: string;
  tableId: string;
  paperSize: 'letter' | 'a4';
  orientation: 'portrait' | 'landscape';
  bands: ReportBand[];
}

export interface VFPProgram {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface MountedFileInfo {
  name: string;
  size: number;
  lastModified: string;
  type: string;
  handle?: any;
}

export interface VFPProject {
  id: string;
  name: string;
  description: string;
  version: string;
  database: DBFDatabase;
  freeTables: DBFTable[];
  forms: FormDefinition[];
  queries: QueryDefinition[];
  reports: ReportDefinition[];
  programs: VFPProgram[];
  defaultDrive?: string;
  currentDirectory?: string;
  searchPath?: string;
  mountedFolderName?: string;
  mountedFiles?: MountedFileInfo[];
}

export interface VFPCommandLog {
  id: string;
  command: string;
  success: boolean;
  message: string;
  timestamp: string;
  resultRows?: number;
  tableAffected?: string;
}
