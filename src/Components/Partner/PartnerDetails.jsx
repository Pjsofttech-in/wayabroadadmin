import React, { useState } from "react";
import {
  Grid,
  TextField,
  Typography,
  Paper,
  Box,
  MenuItem,
  Button
} from "@mui/material";

const initialState = {
  businessName: "",
  businessEmail: "",
  businessContact: "",
  partnerContact: "",
  partnerAddress: "",
  authorityName: "",
  authorityEmail: "",
  authorityContact: "",
  partnerCountry: "",
  partnerCity: "",
  partnerDistrict: "",
  partnerPincode: "",
  state: "",
  status: "",
  conductedBy: "",
  contractType: "",
  instituteType: "",
  university: "",
  commissionPercent: "",
  remark: "",
  designation: "",
  createdByEmail: "",
  role: "partner",
  authorityDesignation: ""
};

export default function PartnerDetails({ data: propData, onChange: propOnChange }) {
  const [form, setForm] = useState(initialState);
  const [msg, setMsg] = useState("");
  
  const countries = ["India", "USA", "UK", "Canada", "Australia", "New Zealand", "UAE", "Singapore", "Germany", "France"];
  
  const states = {
    "India": [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
      "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
      "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
      "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
      "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
      "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
      "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
      "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ],
    "USA": [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
      "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
      "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
      "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", 
      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
      "New Hampshire", "New Jersey", "New Mexico", "New York", 
      "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", 
      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
      "West Virginia", "Wisconsin", "Wyoming"
    ],
    "UK": [
      "England", "Scotland", "Wales", "Northern Ireland"
    ],
    "Canada": [
      "Alberta", "British Columbia", "Manitoba", "New Brunswick", 
      "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", 
      "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", 
      "Yukon"
    ],
    "Australia": [
      "Australian Capital Territory", "New South Wales", "Northern Territory", 
      "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"
    ],
    "New Zealand": [
      "Auckland", "Bay of Plenty", "Canterbury", "Gisborne", "Hawke's Bay", 
      "Manawatu-Wanganui", "Marlborough", "Nelson", "Northland", "Otago", 
      "Southland", "Taranaki", "Tasman", "Waikato", "Wellington", "West Coast"
    ],
    "UAE": [
      "Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"
    ],
    "Singapore": ["Singapore"],
    "Germany": [
      "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", 
      "Hamburg", "Hesse", "Mecklenburg-Vorpommern", "Lower Saxony", 
      "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", 
      "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"
    ],
    "France": [
      "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", 
      "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France", 
      "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", 
      "Pays de la Loire", "Provence-Alpes-Côte d'Azur"
    ]
  };

  const districts = {
    // India - Major States with extensive district coverage
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Tirupati", "Anantapur", "Kadapa", "Rajahmundry", "Eluru", "Ongole", "Chittoor", "Hindupur", "Vizianagaram", "Srikakulam", "Machilipatnam", "Tenali", "Proddatur", "Tadepalligudem"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Tawang", "Bomdila", "Pasighat", "Aalo", "Ziro", "Tezu", "Daporijo", "Namsai", "Roing", "Seppa", "Koloriang", "Anini", "Khonsa", "Yingkiong", "Basar", "Jairampur", "Dambuk", "Tuting"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Diphu", "North Lakhimpur", "Karimganj", "Goalpara", "Barpeta", "Sivasagar", "Golaghat", "Dhemaji", "Morigaon", "Nalbari", "Kokrajhar"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Arrah", "Begusarai", "Chhapra", "Katihar", "Munger", "Purnia", "Saharsa", "Sasaram", "Hajipur", "Sitamarhi", "Samastipur", "Motihari", "Bettiah", "Buxar", "Jamalpur"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari", "Mahasamund", "Dantewada", "Janjgir-Champa", "Kanker", "Kawardha", "Balod", "Bemetara", "Balrampur", "Sukma", "Koriya"],
    "Goa": ["North Goa", "South Goa", "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Pernem", "Valpoi", "Quepem", "Canacona", "Sanguem", "Bicholim", "Sattari", "Dharbandora", "Tiswadi", "Salcete", "Mormugao", "Bardez", "Ponda"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Gandhidham", "Anand", "Navsari", "Morbi", "Nadiad", "Surendranagar", "Bharuch", "Mehsana", "Bhuj", "Porbandar", "Palanpur", "Valsad", "Vapi"],
    "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Sirsa", "Bhiwani", "Bahadurgarh", "Jind", "Thanesar", "Kaithal", "Rewari", "Palwal", "Hansi", "Narnaul"],
    "Himachal Pradesh": ["Shimla", "Mandi", "Solan", "Dharamshala", "Bilaspur", "Kullu", "Chamba", "Kangra", "Una", "Hamirpur", "Nahan", "Palampur", "Sundarnagar", "Nurpur", "Kasauli", "Manali", "Dalhousie", "Mandi", "Parwanoo", "Jogindernagar"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Chirkunda", "Bharatpur", "Daltonganj", "Sahibganj", "Chaibasa", "Chatra", "Garhwa", "Koderma", "Simdega", "Pakur"],
    "Karnataka": ["Bangalore Urban", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Davanagere", "Shivamogga", "Ballari", "Vijayapura", "Tumakuru", "Raichur", "Bidar", "Hassan", "Shivamogga", "Udupi", "Chitradurga", "Kolar", "Mandya", "Chikmagalur", "Chamarajanagar", "Kodagu", "Bagalkot", "Gadag", "Haveri", "Yadgir", "Ramanagara", "Chikkaballapura", "Koppal", "Vijayanagara"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Kannur", "Alappuzha", "Kottayam", "Palakkad", "Malappuram", "Thalassery", "Koyilandy", "Kannur", "Kasaragod", "Kattappana", "Kayamkulam", "Kodungallur", "Kothamangalam", "Koyilandy", "Manjeri", "Nedumangad", "Neyyattinkara", "Nileshwaram", "Ottappalam", "Payyanur", "Perinthalmanna", "Ponnani", "Taliparamba", "Tirur", "Varkala"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Murwara", "Singrauli", "Burhanpur", "Khandwa", "Morena", "Bhind", "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Chhatarpur", "Damoh", "Mandsaur", "Khargone", "Neemuch", "Pithampur", "Hoshangabad", "Itarsi", "Sehore", "Betul"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Pimpri-Chinchwad", "Aurangabad", "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Amravati", "Nanded", "Kolhapur", "Sangli", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna", "Ambarnath", "Bhusawal", "Panvel", "Badlapur", "Beed", "Gondia", "Yavatmal"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul", "Senapati", "Tamenglong", "Chandel", "Kakching", "Kangpokpi", "Jiribam", "Noney", "Pherzawl", "Kamjong", "Tengnoupal"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongstoin", "Nongpoh", "Williamnagar", "Baghmara", "Resubelpara", "Mairang", "Mankachar", "Amlarem", "Khliehriat", "Mawkyrwat", "Mawphlang", "Nongpoh", "Nongstoin", "Sohra", "Tikrikilla"],
    "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Saitual", "Khawzawl", "Hnahthial", "Siaha", "Khawhai", "Tlabung", "Vairengte", "Thenzawl", "Darlawn", "Sairang", "Bilkhawthlir", "Darlawn"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Mon", "Longleng", "Kiphire", "Peren", "Noklak", "Shamator", "Tseminyu", "Niuland", "Chumukedima"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Jeypore", "Bhuban", "Rayagada", "Jharsuguda", "Bargarh", "Bhawanipatna", "Dhenkanal", "Barbil", "Kendujhar", "Paradip"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Hoshiarpur", "Mohali", "Batala", "Pathankot", "Moga", "Abohar", "Malerkotla", "Khanna", "Phagwara", "Muktsar", "Barnala", "Rajpura", "Fazilka", "Kapurthala", "Zirakpur"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sri Ganganagar", "Sikar", "Pali", "Tonk", "Hanumangarh", "Dausa", "Churu", "Jhunjhunu", "Nagaur", "Baran", "Jalore"],
    "Sikkim": ["Gangtok", "Namchi", "Geyzing", "Mangan", "Rangpo", "Jorethang", "Singtam", "Pelling", "Ravangla", "Lachen", "Lachung", "Yuksom", "Rongli", "Mangan", "Rumtek", "Pakyong", "Soreng", "Melli", "Rhenock", "Chungthang"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Hosur", "Nagercoil", "Kanchipuram", "Kumbakonam", "Tirunelveli", "Cuddalore", "Karaikudi", "Sivakasi", "Ooty", "Hosur", "Neyveli", "Kumbakonam", "Tiruvannamalai", "Pudukkottai", "Tiruchengode", "Pollachi", "Rajapalayam", "Gobichettipalayam", "Theni"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahabubnagar", "Nalgonda", "Adilabad", "Suryapet", "Siddipet", "Jangaon", "Wanaparthy", "Mancherial", "Kamareddy", "Kothagudem", "Miryalaguda", "Nirmal", "Jagtial", "Sangareddy"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Pratapgarh", "Kailasahar", "Belonia", "Khowai", "Teliamura", "Ambassa", "Kumarghat", "Amarpur", "Sabroom", "Kailashahar", "Kamalpur", "Bishalgarh", "Santirbazar", "Khowai", "Sonamura", "Dharamnagar", "Panisagar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Prayagraj", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Noida", "Jhansi", "Shahjahanpur", "Rampur", "Mathura", "Firozabad", "Ayodhya", "Sitapur", "Bahraich", "Mirzapur", "Sambhal", "Amroha", "Hardoi", "Fatehpur", "Raebareli", "Orai", "Sultanpur", "Banda"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Ramnagar", "Pithoragarh", "Srinagar", "Almora", "Mussoorie", "Nainital", "Rudraprayag", "Kotdwar", "Bageshwar", "Champawat", "Pauri", "Tehri", "Uttarkashi"],
    "West Bengal": ["Kolkata", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur", "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia", "Raiganj", "Krishnanagar", "Nabadwip", "Medinipur", "Jalpaiguri", "Balurghat"],
    
    // Union Territories
    "Andaman and Nicobar Islands": ["Port Blair", "Garacharma", "Bambooflat", "Prothrapur", "Mayabunder", "Car Nicobar", "Diglipur", "Rangat", "Hut Bay", "Ferrargunj", "Bakultala", "Kadamtala", "Katchal", "Campbell Bay", "Nancowry", "Teressa", "Havelock Island", "Neil Island", "Baratang", "Diglipur"],
    "Chandigarh": ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa", "Dadra", "Naroli", "Amli", "Vapi", "Rakholi", "Masat", "Galonda", "Dudhani", "Khanvel", "Kachigam", "Kherdi", "Samarvarni", "Khadoli", "Kadaiya", "Kilmorad", "Tighra", "Dabhel"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Pulwama", "Kupwara", "Budgam", "Ganderbal", "Shopian", "Kulgam", "Rajouri", "Poonch", "Doda", "Kishtwar", "Ramban", "Udhampur", "Reasi", "Kathua", "Samba", "Bandipora"],
    "Ladakh": ["Leh", "Kargil", "Nubra", "Zanskar", "Drass", "Dah-Bema", "Nyoma", "Taisuru", "Kharu", "Chushul", "Chumathang", "Turtuk", "Hunder", "Diskit", "Panamik", "Upshi", "Alchi", "Hemis", "Thiksey", "Shey"],
    "Lakshadweep": ["Kavaratti", "Agatti", "Amini", "Andrott", "Kadmat", "Kalpeni", "Kiltan", "Minicoy", "Chetlat", "Bitra", "Kadmat", "Bangaram", "Suheli", "Pitti", "Kiltan", "Amini", "Andrott", "Kavaratti", "Minicoy", "Agatti"],
    "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam", "Ozhukarai", "Villianur", "Ariyankuppam", "Nettapakkam", "Bahour", "Nettapakkam", "Thirubuvanai", "Manavely", "Nettapakkam", "Thirukanchi", "Thirunallar", "Neravy", "Niravi", "Thirumalairayanpattinam", "Tirunallar", "Tirumalairayanpattinam"],
    
    // USA
    "California": ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim"],
    "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"],
    "Texas": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo"],
    "Florida": ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral"],
    
    // UK
    "England": ["London", "Birmingham", "Manchester", "Liverpool", "Bristol", "Sheffield", "Leeds", "Leicester", "Coventry", "Nottingham"],
    "Scotland": ["Glasgow", "Edinburgh", "Aberdeen", "Dundee", "Paisley", "East Kilbride", "Livingston", "Hamilton", "Cumbernauld", "Kirkcaldy"],
    "Wales": ["Cardiff", "Swansea", "Newport", "Wrexham", "Barry", "Neath", "Cwmbran", "Bridgend", "Llanelli", "Aberdare"],
    "Northern Ireland": ["Belfast", "Derry", "Lisburn", "Newtownabbey", "Bangor", "Ballymena", "Newtownards", "Carrickfergus", "Newry", "Coleraine"],
    
    // Canada
    "Ontario": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener", "Windsor"],
    "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Lévis", "Trois-Rivières", "Terrebonne"],
    "British Columbia": ["Vancouver", "Surrey", "Burnaby", "Richmond", "Abbotsford", "Coquitlam", "Kelowna", "Saanich", "Langley", "Delta"],
    "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie", "Airdrie", "Spruce Grove", "Leduc"],
    
    // Australia
    "New South Wales": ["Sydney", "Newcastle", "Central Coast", "Wollongong", "Maitland", "Albury", "Tamworth", "Port Macquarie", "Orange", "Dubbo"],
    "Victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Melton", "Mildura", "Shepparton", "Warrnambool", "Wodonga", "Wangaratta"],
    "Queensland": ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville", "Cairns", "Toowoomba", "Mackay", "Rockhampton", "Bundaberg", "Hervey Bay"],
    "Western Australia": ["Perth", "Mandurah", "Bunbury", "Geraldton", "Kalgoorlie", "Albany", "Busselton", "Port Hedland", "Karratha", "Broome"]
  };
  
  // Use prop data if available, otherwise use local state
  const data = propData || form;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...data, [name]: value };
    setForm(newData);
    if (propOnChange) {
      propOnChange({ target: { name, value } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add your form submission logic here
      console.log('Form submitted:', form);
      setMsg("Partner details saved successfully!");
    } catch (err) {
      console.error("Error saving partner details:", err);
      setMsg("Failed to save partner details");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={0.5} justifyContent="center" className="textField-root">
        {/* Row 1 */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Business Name"
            name="businessName"
            value={data.businessName || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Business Email"
            name="businessEmail"
            type="email"
            value={data.businessEmail || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Business Contact"
            name="businessContact"
            value={data.businessContact || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
            type="tel"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Authority Name"
            name="authorityName"
            value={data.authorityName || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
          />
        </Grid>

        {/* Row 2 */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Authority Email"
            name="authorityEmail"
            type="email"
            value={data.authorityEmail || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Authority Contact"
            name="authorityContact"
            value={data.authorityContact || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
            type="tel"
          />
        </Grid>     

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Partner Contact"
            name="partnerContact"
            value={data.partnerContact || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
            type="tel"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Authority Designation"
            name="authorityDesignation"
            value={data.authorityDesignation || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
          />
        </Grid>

        {/* Row 3 */}
        {/* <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Partner Designation"
            name="designation"
            value={data.designation || ""}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
        </Grid> */}

        {/* Location Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
            Location Information
          </Typography>
        </Grid>
        
        {/* Location Information Row 1 */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField 
            label="Country" 
            name="partnerCountry" 
            value={data.partnerCountry} 
            onChange={handleChange} 
            fullWidth 
            margin="normal" 
            select
            required
          >
            <MenuItem value="">Select</MenuItem>
            {countries.map((partnerCountry) => (
              <MenuItem key={partnerCountry} value={partnerCountry}>{partnerCountry}</MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <TextField 
            label="State" 
            name="state" 
            value={data.state} 
            onChange={handleChange} 
            fullWidth 
            margin="normal" 
            select
            required
          >
            <MenuItem value="">Select</MenuItem>
            {(data.partnerCountry && states[data.partnerCountry] || []).map((state) => (
              <MenuItem key={state} value={state}>{state}</MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <TextField 
            label="District" 
            name="partnerDistrict" 
            value={data.partnerDistrict} 
            onChange={handleChange} 
            fullWidth 
            margin="normal" 
            select
            required
          >
            <MenuItem value="">Select</MenuItem>
            {(data.state && districts[data.state] || []).map((district) => (
              <MenuItem key={district} value={district}>{district}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField 
            label="City" 
            name="partnerCity" 
            value={data.partnerCity} 
            onChange={handleChange} 
            fullWidth 
            margin="dense" 
            required
          />
        </Grid>

        {/* Location Information Row 2 */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField 
            label="Pincode" 
            name="partnerPincode" 
            type="number"
            value={data.partnerPincode} 
            onChange={handleChange} 
            fullWidth 
            margin="dense"
            inputProps={{ min: 0 }}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField 
            label="Address" 
            name="partnerAddress" 
            value={data.partnerAddress} 
            onChange={handleChange} 
            fullWidth 
            margin="dense" 
            multiline
            rows={1}
            required
          />
        </Grid>

        {msg && (
          <Grid item xs={12}>
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1, 
                color: msg.includes('success') ? 'success.main' : 'error.main' 
              }}
            >
              {msg}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
