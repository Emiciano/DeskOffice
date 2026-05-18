export type CompanySettings = {
  companyId: string;
  companyName: string;
  companySuffix: string;
  legalForm: string;
  managingDirector: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  vatId: string;
  taxNumber: string;
  districtCourt: string;
  commercialRegisterNo: string;
  vatMode: "standard" | "small-business";
  profitMethod: "euer" | "guv";
  defaultTaxRate: number;
  accountFrame: "SKR03" | "SKR04";
  priceInputMode: "netto" | "brutto";
  bankName: string;
  accountNumber: string;
  bankCode: string;
  iban: string;
  bic: string;
  logoUrl: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  offerPrefix: string;
  offerNextNumber: number;
  invoiceTemplate: "clean" | "modern" | "compact";
};

export const defaultCompanySettings: CompanySettings = {
  companyId: "",
  companyName: "",
  companySuffix: "",
  legalForm: "",
  managingDirector: "",
  street: "",
  postalCode: "",
  city: "",
  country: "Deutschland",
  phone: "",
  fax: "",
  email: "",
  website: "",
  vatId: "",
  taxNumber: "",
  districtCourt: "",
  commercialRegisterNo: "",
  vatMode: "standard",
  profitMethod: "euer",
  defaultTaxRate: 19,
  accountFrame: "SKR04",
  priceInputMode: "brutto",
  bankName: "",
  accountNumber: "",
  bankCode: "",
  iban: "",
  bic: "",
  logoUrl: "",
  invoicePrefix: "RE",
  invoiceNextNumber: 101,
  offerPrefix: "AN",
  offerNextNumber: 31,
  invoiceTemplate: "clean",
};
