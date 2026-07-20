import * as Yup from "yup";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;
const aadharRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

export const getInstituteValidationSchema = (paymentMode) =>
  Yup.object().shape({
    ownerName: Yup.string().required("Owner name is required"),
    instituteName: Yup.string().required("Institute name is required"),
    instituteEmail: Yup.string()
      .matches(emailRegex, "Invalid email format")
      .required("Email is required"),
    phoneNumber: Yup.string()
      .matches(phoneRegex, "Phone number must be 10 digits")
      .required("Phone number is required"),
    mobileNumber: Yup.string()
      .matches(phoneRegex, "Mobile number must be 10 digits")
      .required("Mobile number is required"),
    password: Yup.string().required("Password is required"),
    country: Yup.string().required("Country is required"),
    state: Yup.string().required("State is required"),
    district: Yup.string().required("District is required"),
    city: Yup.string().required("City is required"),
    address: Yup.string().required("Address is required"),
    pincode: Yup.string()
      .matches(pincodeRegex, "Invalid Indian pincode")
      .required("Pincode is required"),
    aadhar: Yup.string()
      .matches(aadharRegex, "Aadhar must be 12 digits")
      .required("Aadhar is required"),
    pancard: Yup.string()
      .matches(panRegex, "Invalid PAN format")
      .required("PAN card is required"),
    websiteName: Yup.string(),
    paymentMode: Yup.string().required("Payment mode is required"),
    // transactionId: Yup.string().when("paymentMode", {
    //   is: (mode) => mode !== "Cash",
    //   then: Yup.string().required("Transaction ID is required"),
    //   otherwise: Yup.string().notRequired(),
    // }),
    gstNo: Yup.string(),
  });
