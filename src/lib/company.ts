export interface CompanyConfig {
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  taxNumber: string;
  registrationNumber: string;
  contractHeader: string;
  contractSubheader: string;
  demoEmail: string;
  demoPassword: string;
}

export const company: CompanyConfig = {
  name: 'Demo Rent a Car',
  phone: '+30 28210 00000',
  email: 'info@demo-rentacar.gr',
  address: 'Χανιά, Κρήτη',
  website: 'www.demo-rentacar.gr',
  taxNumber: '000000000',
  registrationNumber: 'ΑΕ 00000',
  contractHeader: 'DEMO RENT A CAR',
  contractSubheader: 'Chania, Crete',
  demoEmail: 'manager@antilia.com',
  demoPassword: 'demo123',
};
