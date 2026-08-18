import { DBFDatabase, DBFTable, FormDefinition, QueryDefinition, ReportDefinition, VFPProject } from '../types/foxpro';

export const sampleCustomersTable: DBFTable = {
  id: 'tbl_customers',
  name: 'CUSTOMERS',
  filename: 'customers.dbf',
  lastModified: '2026-08-15',
  fields: [
    { name: 'CUST_ID', type: 'C', length: 6, decimals: 0, nullable: false, isPrimaryKey: true, indexTag: 'CUST_PK' },
    { name: 'COMPANY', type: 'C', length: 35, decimals: 0, nullable: false, indexTag: 'COMP_TAG' },
    { name: 'CONTACT', type: 'C', length: 30, decimals: 0, nullable: true },
    { name: 'CITY', type: 'C', length: 25, decimals: 0, nullable: true },
    { name: 'COUNTRY', type: 'C', length: 20, decimals: 0, nullable: true },
    { name: 'PHONE', type: 'C', length: 20, decimals: 0, nullable: true },
    { name: 'BALANCE', type: 'Y', length: 12, decimals: 2, nullable: false, defaultValue: '0.00' },
    { name: 'CREDIT_LMT', type: 'N', length: 10, decimals: 2, nullable: false, defaultValue: '5000.00' },
    { name: 'ACTIVE', type: 'L', length: 1, decimals: 0, nullable: false, defaultValue: 'true' },
    { name: 'JOIN_DATE', type: 'D', length: 8, decimals: 0, nullable: true },
    { name: 'NOTES', type: 'M', length: 10, decimals: 0, nullable: true },
  ],
  records: [
    { _recno: 1, _deleted: false, CUST_ID: 'ALFKI', COMPANY: 'Alfreds Futterkiste', CONTACT: 'Maria Anders', CITY: 'Berlin', COUNTRY: 'Germany', PHONE: '030-0074321', BALANCE: 840.50, CREDIT_LMT: 5000.00, ACTIVE: true, JOIN_DATE: '2023-03-12', NOTES: 'VIP customer with prompt payment history.' },
    { _recno: 2, _deleted: false, CUST_ID: 'ANATR', COMPANY: 'Ana Trujillo Emparedados', CONTACT: 'Ana Trujillo', CITY: 'México D.F.', COUNTRY: 'Mexico', PHONE: '(5) 555-4729', BALANCE: 0.00, CREDIT_LMT: 2500.00, ACTIVE: true, JOIN_DATE: '2023-05-18', NOTES: 'Catering delivery on Tuesdays.' },
    { _recno: 3, _deleted: false, CUST_ID: 'ANTON', COMPANY: 'Antonio Moreno Taquería', CONTACT: 'Antonio Moreno', CITY: 'México D.F.', COUNTRY: 'Mexico', PHONE: '(5) 555-3932', BALANCE: 2150.00, CREDIT_LMT: 4000.00, ACTIVE: true, JOIN_DATE: '2022-11-04', NOTES: 'Special discount 5% on bulk taco shells.' },
    { _recno: 4, _deleted: false, CUST_ID: 'AROUT', COMPANY: 'Around the Horn', CONTACT: 'Thomas Hardy', CITY: 'London', COUNTRY: 'UK', PHONE: '(171) 555-7788', BALANCE: 3400.75, CREDIT_LMT: 10000.00, ACTIVE: true, JOIN_DATE: '2021-08-20', NOTES: 'Key European distributor.' },
    { _recno: 5, _deleted: false, CUST_ID: 'BERGS', COMPANY: 'Berglunds snabbköp', CONTACT: 'Christina Berglund', CITY: 'Luleå', COUNTRY: 'Sweden', PHONE: '0921-12 34 65', BALANCE: 120.00, CREDIT_LMT: 6000.00, ACTIVE: true, JOIN_DATE: '2023-01-15', NOTES: 'Requires Swedish invoice customs slip.' },
    { _recno: 6, _deleted: false, CUST_ID: 'BLAUS', COMPANY: 'Blauer See Delikatessen', CONTACT: 'Hanna Moos', CITY: 'Mannheim', COUNTRY: 'Germany', PHONE: '0621-08460', BALANCE: 4590.20, CREDIT_LMT: 8000.00, ACTIVE: true, JOIN_DATE: '2022-04-10', NOTES: 'Organic cheese and wine supplier.' },
    { _recno: 7, _deleted: false, CUST_ID: 'BLONP', COMPANY: 'Blondel père et fils', CONTACT: 'Frédérique Citeaux', CITY: 'Strasbourg', COUNTRY: 'France', PHONE: '88.60.15.31', BALANCE: 0.00, CREDIT_LMT: 4500.00, ACTIVE: false, JOIN_DATE: '2021-02-14', NOTES: 'Account paused pending credit review.' },
    { _recno: 8, _deleted: false, CUST_ID: 'BOLID', COMPANY: 'Bólido Comidas preparadas', CONTACT: 'Martín Sommer', CITY: 'Madrid', COUNTRY: 'Spain', PHONE: '(91) 555 22 82', BALANCE: 780.00, CREDIT_LMT: 3500.00, ACTIVE: true, JOIN_DATE: '2024-02-01', NOTES: 'Fast delivery requested via courier.' },
  ],
  indexes: [
    { tag: 'CUST_PK', expression: 'CUST_ID', order: 'ASC', isUnique: true },
    { tag: 'COMP_TAG', expression: 'COMPANY', order: 'ASC' },
  ],
  activeTag: 'COMP_TAG',
};

export const sampleProductsTable: DBFTable = {
  id: 'tbl_products',
  name: 'PRODUCTS',
  filename: 'products.dbf',
  lastModified: '2026-08-16',
  fields: [
    { name: 'PROD_ID', type: 'I', length: 6, decimals: 0, nullable: false, isPrimaryKey: true, indexTag: 'PROD_PK' },
    { name: 'PROD_NAME', type: 'C', length: 40, decimals: 0, nullable: false },
    { name: 'CATEGORY', type: 'C', length: 20, decimals: 0, nullable: false },
    { name: 'UNIT_PRICE', type: 'Y', length: 10, decimals: 2, nullable: false, defaultValue: '0.00' },
    { name: 'UNITS_STK', type: 'N', length: 6, decimals: 0, nullable: false, defaultValue: '0' },
    { name: 'REORDER_LVL', type: 'N', length: 6, decimals: 0, nullable: false, defaultValue: '10' },
    { name: 'DISCONT', type: 'L', length: 1, decimals: 0, nullable: false, defaultValue: 'false' },
  ],
  records: [
    { _recno: 1, _deleted: false, PROD_ID: 101, PROD_NAME: 'Chai Tea Spiced', CATEGORY: 'Beverages', UNIT_PRICE: 18.00, UNITS_STK: 39, REORDER_LVL: 10, DISCONT: false },
    { _recno: 2, _deleted: false, PROD_ID: 102, PROD_NAME: 'Chang Organic Lager', CATEGORY: 'Beverages', UNIT_PRICE: 19.00, UNITS_STK: 17, REORDER_LVL: 25, DISCONT: false },
    { _recno: 3, _deleted: false, PROD_ID: 103, PROD_NAME: 'Aniseed Syrup Sweet', CATEGORY: 'Condiments', UNIT_PRICE: 10.00, UNITS_STK: 5, REORDER_LVL: 15, DISCONT: false },
    { _recno: 4, _deleted: false, PROD_ID: 104, PROD_NAME: "Chef Anton's Cajun Seasoning", CATEGORY: 'Condiments', UNIT_PRICE: 22.00, UNITS_STK: 53, REORDER_LVL: 10, DISCONT: false },
    { _recno: 5, _deleted: false, PROD_ID: 105, PROD_NAME: "Chef Anton's Gumbo Mix", CATEGORY: 'Condiments', UNIT_PRICE: 21.35, UNITS_STK: 0, REORDER_LVL: 20, DISCONT: true },
    { _recno: 6, _deleted: false, PROD_ID: 106, PROD_NAME: "Grandma's Boysenberry Spread", CATEGORY: 'Condiments', UNIT_PRICE: 25.00, UNITS_STK: 120, REORDER_LVL: 25, DISCONT: false },
    { _recno: 7, _deleted: false, PROD_ID: 107, PROD_NAME: "Uncle Bob's Organic Dried Pears", CATEGORY: 'Produce', UNIT_PRICE: 30.00, UNITS_STK: 15, REORDER_LVL: 10, DISCONT: false },
    { _recno: 8, _deleted: false, PROD_ID: 108, PROD_NAME: 'Northwoods Cranberry Sauce', CATEGORY: 'Condiments', UNIT_PRICE: 40.00, UNITS_STK: 6, REORDER_LVL: 15, DISCONT: false },
  ],
  indexes: [
    { tag: 'PROD_PK', expression: 'PROD_ID', order: 'ASC', isUnique: true },
    { tag: 'CAT_TAG', expression: 'CATEGORY', order: 'ASC' },
  ],
};

export const sampleOrdersTable: DBFTable = {
  id: 'tbl_orders',
  name: 'ORDERS',
  filename: 'orders.dbf',
  lastModified: '2026-08-17',
  fields: [
    { name: 'ORDER_ID', type: 'I', length: 6, decimals: 0, nullable: false, isPrimaryKey: true },
    { name: 'CUST_ID', type: 'C', length: 6, decimals: 0, nullable: false },
    { name: 'ORDER_DATE', type: 'D', length: 8, decimals: 0, nullable: false },
    { name: 'SHIP_VIA', type: 'C', length: 20, decimals: 0, nullable: true },
    { name: 'FREIGHT', type: 'Y', length: 10, decimals: 2, nullable: false, defaultValue: '0.00' },
    { name: 'TOTAL_AMT', type: 'Y', length: 12, decimals: 2, nullable: false, defaultValue: '0.00' },
    { name: 'STATUS', type: 'C', length: 15, decimals: 0, nullable: false, defaultValue: 'PENDING' },
  ],
  records: [
    { _recno: 1, _deleted: false, ORDER_ID: 10248, CUST_ID: 'ALFKI', ORDER_DATE: '2026-07-04', SHIP_VIA: 'Speedy Express', FREIGHT: 32.38, TOTAL_AMT: 440.00, STATUS: 'DELIVERED' },
    { _recno: 2, _deleted: false, ORDER_ID: 10249, CUST_ID: 'ANATR', ORDER_DATE: '2026-07-05', SHIP_VIA: 'United Package', FREIGHT: 11.61, TOTAL_AMT: 1863.40, STATUS: 'DELIVERED' },
    { _recno: 3, _deleted: false, ORDER_ID: 10250, CUST_ID: 'ANTON', ORDER_DATE: '2026-07-08', SHIP_VIA: 'Federal Shipping', FREIGHT: 65.83, TOTAL_AMT: 1553.00, STATUS: 'SHIPPED' },
    { _recno: 4, _deleted: false, ORDER_ID: 10251, CUST_ID: 'AROUT', ORDER_DATE: '2026-07-08', SHIP_VIA: 'Speedy Express', FREIGHT: 41.34, TOTAL_AMT: 654.00, STATUS: 'DELIVERED' },
    { _recno: 5, _deleted: false, ORDER_ID: 10252, CUST_ID: 'ALFKI', ORDER_DATE: '2026-08-01', SHIP_VIA: 'United Package', FREIGHT: 51.30, TOTAL_AMT: 3597.90, STATUS: 'PROCESSING' },
    { _recno: 6, _deleted: false, ORDER_ID: 10253, CUST_ID: 'BERGS', ORDER_DATE: '2026-08-10', SHIP_VIA: 'Federal Shipping', FREIGHT: 58.17, TOTAL_AMT: 1444.80, STATUS: 'PROCESSING' },
  ],
  indexes: [
    { tag: 'ORD_PK', expression: 'ORDER_ID', order: 'ASC', isUnique: true },
    { tag: 'ORD_CUST', expression: 'CUST_ID', order: 'ASC' },
  ],
};

export const sampleCustomerForm: FormDefinition = {
  id: 'frm_customers',
  name: 'frmCustomerMaster',
  caption: 'Customer Master Maintenance (SCX)',
  width: 680,
  height: 520,
  backColor: '#f8fafc',
  foreColor: '#0f172a',
  initialTableId: 'tbl_customers',
  createdDate: '2026-08-16',
  description: 'Full Visual FoxPro style Customer Maintenance screen with data binding, search, calculations, and record buffer controls.',
  controls: [
    // Header Bar
    {
      id: 'ctrl_hdr',
      name: 'shpHeader',
      type: 'shape',
      left: 16,
      top: 16,
      width: 648,
      height: 56,
      backColor: '#e2e8f0',
      borderStyle: 'single',
      borderRadius: 8,
    },
    {
      id: 'ctrl_lbl_title',
      name: 'lblTitle',
      type: 'label',
      left: 32,
      top: 26,
      width: 320,
      height: 24,
      caption: 'FoxStudio Customer Maintenance',
      fontSize: 18,
      fontWeight: 'bold',
      foreColor: '#0f172a',
    },
    {
      id: 'ctrl_lbl_recno',
      name: 'lblRecno',
      type: 'label',
      left: 480,
      top: 30,
      width: 160,
      height: 20,
      caption: 'Record: RECNO() / RECCOUNT()',
      fontSize: 13,
      foreColor: '#64748b',
      alignment: 'right',
    },

    // Form Controls
    {
      id: 'ctrl_lbl_id',
      name: 'lblCustId',
      type: 'label',
      left: 24,
      top: 92,
      width: 120,
      height: 20,
      caption: 'Customer Code:',
      fontWeight: '600',
    },
    {
      id: 'ctrl_txt_id',
      name: 'txtCustId',
      type: 'textbox',
      left: 150,
      top: 88,
      width: 140,
      height: 32,
      controlSource: 'CUSTOMERS.CUST_ID',
      format: '@!',
      readOnly: false,
    },

    {
      id: 'ctrl_chk_active',
      name: 'chkActive',
      type: 'checkbox',
      left: 340,
      top: 92,
      width: 160,
      height: 28,
      caption: 'Account Active',
      controlSource: 'CUSTOMERS.ACTIVE',
    },

    {
      id: 'ctrl_lbl_company',
      name: 'lblCompany',
      type: 'label',
      left: 24,
      top: 136,
      width: 120,
      height: 20,
      caption: 'Company Name:',
      fontWeight: '600',
    },
    {
      id: 'ctrl_txt_company',
      name: 'txtCompany',
      type: 'textbox',
      left: 150,
      top: 132,
      width: 380,
      height: 32,
      controlSource: 'CUSTOMERS.COMPANY',
    },

    {
      id: 'ctrl_lbl_contact',
      name: 'lblContact',
      type: 'label',
      left: 24,
      top: 180,
      width: 120,
      height: 20,
      caption: 'Contact Person:',
    },
    {
      id: 'ctrl_txt_contact',
      name: 'txtContact',
      type: 'textbox',
      left: 150,
      top: 176,
      width: 220,
      height: 32,
      controlSource: 'CUSTOMERS.CONTACT',
    },

    {
      id: 'ctrl_lbl_phone',
      name: 'lblPhone',
      type: 'label',
      left: 390,
      top: 180,
      width: 60,
      height: 20,
      caption: 'Phone:',
    },
    {
      id: 'ctrl_txt_phone',
      name: 'txtPhone',
      type: 'textbox',
      left: 450,
      top: 176,
      width: 180,
      height: 32,
      controlSource: 'CUSTOMERS.PHONE',
    },

    {
      id: 'ctrl_lbl_city',
      name: 'lblCity',
      type: 'label',
      left: 24,
      top: 224,
      width: 120,
      height: 20,
      caption: 'City / Location:',
    },
    {
      id: 'ctrl_txt_city',
      name: 'txtCity',
      type: 'textbox',
      left: 150,
      top: 220,
      width: 180,
      height: 32,
      controlSource: 'CUSTOMERS.CITY',
    },

    {
      id: 'ctrl_lbl_country',
      name: 'lblCountry',
      type: 'label',
      left: 350,
      top: 224,
      width: 80,
      height: 20,
      caption: 'Country:',
    },
    {
      id: 'ctrl_cmb_country',
      name: 'cmbCountry',
      type: 'combobox',
      left: 450,
      top: 220,
      width: 180,
      height: 32,
      controlSource: 'CUSTOMERS.COUNTRY',
      options: ['Germany', 'Mexico', 'UK', 'Sweden', 'France', 'Spain', 'USA', 'Canada', 'Brazil', 'Japan'],
    },

    {
      id: 'ctrl_lbl_balance',
      name: 'lblBalance',
      type: 'label',
      left: 24,
      top: 268,
      width: 120,
      height: 20,
      caption: 'Current Balance ($):',
      fontWeight: '600',
    },
    {
      id: 'ctrl_txt_balance',
      name: 'txtBalance',
      type: 'textbox',
      left: 150,
      top: 264,
      width: 150,
      height: 32,
      controlSource: 'CUSTOMERS.BALANCE',
      format: '$999,999.99',
    },

    {
      id: 'ctrl_lbl_credit',
      name: 'lblCredit',
      type: 'label',
      left: 340,
      top: 268,
      width: 100,
      height: 20,
      caption: 'Credit Limit:',
    },
    {
      id: 'ctrl_txt_credit',
      name: 'txtCredit',
      type: 'textbox',
      left: 450,
      top: 264,
      width: 180,
      height: 32,
      controlSource: 'CUSTOMERS.CREDIT_LMT',
      format: '$999,999.99',
    },

    {
      id: 'ctrl_lbl_notes',
      name: 'lblNotes',
      type: 'label',
      left: 24,
      top: 312,
      width: 120,
      height: 20,
      caption: 'Memo Notes:',
    },
    {
      id: 'ctrl_edt_notes',
      name: 'edtNotes',
      type: 'editbox',
      left: 150,
      top: 308,
      width: 480,
      height: 70,
      controlSource: 'CUSTOMERS.NOTES',
    },

    // Navigation Toolbar
    {
      id: 'ctrl_nav',
      name: 'vcrToolbar',
      type: 'navgroup',
      left: 24,
      top: 400,
      width: 606,
      height: 48,
    },

    // Action Buttons
    {
      id: 'ctrl_btn_quick_query',
      name: 'btnViewOrders',
      type: 'button',
      left: 24,
      top: 460,
      width: 150,
      height: 36,
      caption: 'View Orders (SQL)',
      buttonAction: 'run_query',
      buttonQueryId: 'qry_top_cust',
    },
    {
      id: 'ctrl_btn_calc_avail',
      name: 'btnCalcCredit',
      type: 'button',
      left: 190,
      top: 460,
      width: 180,
      height: 36,
      caption: 'Check Credit Available',
      events: {
        click: 'MESSAGEBOX("Available Credit: $" + STR(CUSTOMERS.CREDIT_LMT - CUSTOMERS.BALANCE, 10, 2), 64, "FoxPro Credit Check");',
      },
    },
    {
      id: 'ctrl_btn_close',
      name: 'cmdClose',
      type: 'button',
      left: 540,
      top: 460,
      width: 90,
      height: 36,
      caption: 'Close Form',
      buttonAction: 'close',
    },
  ],
};

export const sampleTopCustomersQuery: QueryDefinition = {
  id: 'qry_top_cust',
  name: 'q_top_customers.qpr',
  description: 'Visual FoxPro join query summarizing Customer orders and total billing.',
  tables: [
    { tableId: 'tbl_customers', alias: 'CUST', x: 40, y: 30 },
    { tableId: 'tbl_orders', alias: 'ORD', x: 300, y: 30 },
  ],
  joins: [
    {
      id: 'join_1',
      leftTableId: 'tbl_customers',
      leftField: 'CUST_ID',
      rightTableId: 'tbl_orders',
      rightField: 'CUST_ID',
      joinType: 'INNER',
    },
  ],
  selectedFields: [
    { id: 'sf_1', tableId: 'tbl_customers', fieldName: 'CUST_ID', alias: 'Customer_Code' },
    { id: 'sf_2', tableId: 'tbl_customers', fieldName: 'COMPANY', alias: 'Company_Name' },
    { id: 'sf_3', tableId: 'tbl_customers', fieldName: 'CITY', alias: 'City' },
    { id: 'sf_4', tableId: 'tbl_orders', fieldName: 'TOTAL_AMT', alias: 'Total_Sales', aggregate: 'SUM' },
    { id: 'sf_5', tableId: 'tbl_orders', fieldName: 'ORDER_ID', alias: 'Order_Count', aggregate: 'COUNT' },
  ],
  criteria: [],
  groupBy: ['CUST.CUST_ID', 'CUST.COMPANY', 'CUST.CITY'],
  orderBy: [{ id: 'ord_1', tableId: 'tbl_orders', field: 'Total_Sales', direction: 'DESC' }],
};

export const sampleLowStockQuery: QueryDefinition = {
  id: 'qry_low_stock',
  name: 'q_low_stock_alerts.qpr',
  description: 'Identify warehouse items where in-stock quantity is at or below reorder threshold.',
  tables: [{ tableId: 'tbl_products', alias: 'PROD', x: 60, y: 40 }],
  joins: [],
  selectedFields: [
    { id: 'sf_p1', tableId: 'tbl_products', fieldName: 'PROD_ID', alias: 'Product_ID' },
    { id: 'sf_p2', tableId: 'tbl_products', fieldName: 'PROD_NAME', alias: 'Item_Description' },
    { id: 'sf_p3', tableId: 'tbl_products', fieldName: 'CATEGORY', alias: 'Category' },
    { id: 'sf_p4', tableId: 'tbl_products', fieldName: 'UNITS_STK', alias: 'In_Stock' },
    { id: 'sf_p5', tableId: 'tbl_products', fieldName: 'REORDER_LVL', alias: 'Min_Threshold' },
    { id: 'sf_p6', tableId: 'tbl_products', fieldName: 'UNIT_PRICE', alias: 'Unit_Cost' },
  ],
  criteria: [
    {
      id: 'crit_1',
      tableId: 'tbl_products',
      field: 'UNITS_STK',
      operator: '<=',
      value: '15',
      logical: 'AND',
    },
    {
      id: 'crit_2',
      tableId: 'tbl_products',
      field: 'DISCONT',
      operator: '=',
      value: 'false',
      logical: 'AND',
    },
  ],
  groupBy: [],
  orderBy: [{ id: 'ord_2', tableId: 'tbl_products', field: 'UNITS_STK', direction: 'ASC' }],
};

export const sampleCustomerReport: ReportDefinition = {
  id: 'rpt_cust_directory',
  name: 'cust_directory.frx',
  title: 'Visual FoxPro Customer Directory & Balance Statement',
  tableId: 'tbl_customers',
  paperSize: 'a4',
  orientation: 'portrait',
  bands: [
    {
      id: 'band_hdr',
      name: 'Page Header',
      type: 'pageHeader',
      height: 70,
      items: [
        { id: 'ri_title', type: 'label', text: 'FOXSTUDIO ENTERPRISE - CUSTOMER DIRECTORY', left: 20, top: 12, width: 450, height: 24, fontSize: 16, fontWeight: 'bold', foreColor: '#1e293b' },
        { id: 'ri_date', type: 'field', expression: '"Run Date: " + DATE()', left: 490, top: 15, width: 180, height: 18, fontSize: 12, foreColor: '#64748b', alignment: 'right' },
        { id: 'ri_line1', type: 'line', left: 20, top: 44, width: 650, height: 2 },
        { id: 'ri_col1', type: 'label', text: 'Cust ID', left: 20, top: 48, width: 60, height: 18, fontWeight: 'bold', fontSize: 12 },
        { id: 'ri_col2', type: 'label', text: 'Company Name', left: 90, top: 48, width: 190, height: 18, fontWeight: 'bold', fontSize: 12 },
        { id: 'ri_col3', type: 'label', text: 'Contact / Phone', left: 290, top: 48, width: 170, height: 18, fontWeight: 'bold', fontSize: 12 },
        { id: 'ri_col4', type: 'label', text: 'City / Country', left: 470, top: 48, width: 110, height: 18, fontWeight: 'bold', fontSize: 12 },
        { id: 'ri_col5', type: 'label', text: 'Balance', left: 590, top: 48, width: 80, height: 18, fontWeight: 'bold', fontSize: 12, alignment: 'right' },
      ],
    },
    {
      id: 'band_det',
      name: 'Detail Band',
      type: 'detail',
      height: 28,
      items: [
        { id: 'ri_f1', type: 'field', expression: 'CUSTOMERS.CUST_ID', left: 20, top: 4, width: 60, height: 20, fontSize: 12, fontWeight: 'bold' },
        { id: 'ri_f2', type: 'field', expression: 'CUSTOMERS.COMPANY', left: 90, top: 4, width: 190, height: 20, fontSize: 12 },
        { id: 'ri_f3', type: 'field', expression: 'CUSTOMERS.CONTACT + " (" + CUSTOMERS.PHONE + ")"', left: 290, top: 4, width: 170, height: 20, fontSize: 11, foreColor: '#475569' },
        { id: 'ri_f4', type: 'field', expression: 'CUSTOMERS.CITY + ", " + CUSTOMERS.COUNTRY', left: 470, top: 4, width: 110, height: 20, fontSize: 11 },
        { id: 'ri_f5', type: 'field', expression: '"$" + STR(CUSTOMERS.BALANCE, 10, 2)', left: 590, top: 4, width: 80, height: 20, fontSize: 12, alignment: 'right', fontWeight: 'bold' },
      ],
    },
    {
      id: 'band_sum',
      name: 'Summary Band',
      type: 'summary',
      height: 50,
      items: [
        { id: 'ri_sum_line', type: 'line', left: 20, top: 6, width: 650, height: 2 },
        { id: 'ri_sum_lbl', type: 'label', text: 'TOTAL ACCOUNTS OUTSTANDING:', left: 350, top: 16, width: 220, height: 20, fontWeight: 'bold', fontSize: 12, alignment: 'right' },
        { id: 'ri_sum_val', type: 'field', expression: '"$" + STR(SUM(CUSTOMERS.BALANCE), 12, 2)', left: 580, top: 16, width: 90, height: 20, fontSize: 13, fontWeight: 'bold', foreColor: '#0369a1', alignment: 'right' },
      ],
    },
  ],
};

export const sampleVFPProject: VFPProject = {
  id: 'proj_northwind_vfp',
  name: 'Northwind VFP 9 Studio',
  description: 'Complete FoxPro Database Application with Tables, Forms, Visual Queries, Reports, and Program Modules.',
  version: '9.0.0 (Linux Edition)',
  database: {
    id: 'dbc_northwind',
    name: 'NORTHWIND.DBC',
    description: 'Relational Database Container with Customer, Product, and Sales records.',
    tables: [sampleCustomersTable, sampleProductsTable, sampleOrdersTable],
    relations: [
      {
        id: 'rel_cust_ord',
        parentTableId: 'tbl_customers',
        parentField: 'CUST_ID',
        childTableId: 'tbl_orders',
        childField: 'CUST_ID',
        relationType: '1-N',
      },
    ],
    createdAt: '2026-08-16',
  },
  freeTables: [],
  forms: [sampleCustomerForm],
  queries: [sampleTopCustomersQuery, sampleLowStockQuery],
  reports: [sampleCustomerReport],
  defaultDrive: 'X:',
  currentDirectory: 'X:\\VFP_DATA\\',
  searchPath: 'X:\\DATA;X:\\FORMS;X:\\REPORTS',
  programs: [
    {
      id: 'prg_main',
      name: 'MAIN.PRG',
      description: 'Application startup script and environment configuration',
      code: `*==================================================*
* FoxStudio - Visual FoxPro Main Entry Script
*==================================================*
SET TALK OFF
SET ECHO OFF
SET SAFETY OFF
SET DATE TO YMD
SET CENTURY ON
SET EXCLUSIVE OFF

* Set Default Drive and Search Paths
SET DEFAULT TO X:\\VFP_DATA
SET PATH TO X:\\DATA;X:\\FORMS;X:\\REPORTS

* Open Database Container
OPEN DATABASE northwind.dbc SHARED

* Display active status
? "=== Welcome to FoxStudio Universal ==="
? "Default Drive: " + SYS(5)
? "Current Directory: " + CURDIR()
? "Current Database: NORTHWIND.DBC"
? "Version: VFP 9.0 Compatibility Engine"
? "Date: " + DTOC(DATE()) + " Time: " + TIME()

* Launch Customer Maintenance Form
DO FORM frmCustomerMaster.scx

READ EVENTS
CLOSE DATABASES ALL
`,
    },
  ],
};
