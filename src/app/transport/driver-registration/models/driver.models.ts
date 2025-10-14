export interface DriverInfo {
  driver_id?: number;
  first_name: string;
  last_name: string;
  dob?: string;
  age?: number;
  licence_no: string;
  licence_issed_date: string;
  licence_expiry_datedate: string;
  licence_type: string;
  address_door_no: string;
  address_street: string;
  address_town: string;
  address_state: string;
  address_pin_code: string;
  address_landmark?: string;
  contact_num: string;
  contact_num_addl?: string;
  email: string;
  blood_group?: string;
  aadhar: string;
  pan?: string;
  bank_ac_no: string;
  bank_name: string;
  bank_branch: string;
  ifsc: string;
  bank_address: string;
  status: string;
  aadhar_file?: File;
  pan_file?: File;
  driver_image?: File;
}

export interface DriverDocument {
  document_id?: string;
  driver_id?: string;
  document_category: string;
  document_number: string;
  document_image?: File;
  doc_type: string;
}

export interface DriverInsurance {
  insurance_id?: string;
  vehicle_id: string;
  frm_date: string;
  to_date: string;
  insurance_company: string;
  insured_amount: number;
  ins_document?: File;
}

export interface DriverVehicle {
  vehicle_id?: number;
  driver_veh_id?: string;
  veh_number: string;
  registered_date: string; // Keep original field names for local storage
  state: string;
  type_id: string;
  make: string; // Keep original field names
  model: string; // Keep original field names
  driver_id?: string;
  load_capacity: number;
  fuel_type: string;
  rc_document?: File;
  kms_travelled: number;
}

export interface VehicleType {
  type_id: string;
  type_name: string;
}

export interface DriverRegistrationData {
  driverInfo: DriverInfo;
  documents: DriverDocument[];
  vehicles: DriverVehicle[];
  insurance: DriverInsurance[];
  currentStep: number;
  isCompleted: boolean;
}