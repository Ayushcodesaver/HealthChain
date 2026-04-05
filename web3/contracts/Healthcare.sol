// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Healthcare
 * @notice Demo registry for patients, doctors, appointments, prescriptions, medicines, and orders.
 *         Extended medical data is stored off-chain (IPFS); only CIDs and core fields live on-chain.
 */
contract Healthcare {
    address public admin;

    enum AppointmentStatus {
        Pending,
        Confirmed,
        Completed,
        Cancelled
    }

    enum OrderStatus {
        Placed,
        Shipped,
        Delivered,
        Cancelled
    }

    struct Patient {
        bool exists;
        string name;
        uint8 age;
        string recordCid;
    }

    struct Doctor {
        bool exists;
        bool approved;
        string name;
        string specialization;
        string licenseCid;
    }

    struct Appointment {
        uint256 id;
        address patient;
        address doctor;
        uint256 dateTime;
        string reasonCid;
        AppointmentStatus status;
    }

    struct Prescription {
        uint256 id;
        address patient;
        address doctor;
        string detailsCid;
        uint256 issuedAt;
    }

    struct Medicine {
        uint256 id;
        string name;
        uint256 priceWei;
        bool active;
        string metadataCid;
    }

    struct Order {
        uint256 id;
        address patient;
        uint256 medicineId;
        uint256 quantity;
        uint256 totalWei;
        OrderStatus status;
        uint256 placedAt;
    }

    mapping(address => Patient) public patients;
    mapping(address => Doctor) public doctors;

    uint256 public appointmentCount;
    mapping(uint256 => Appointment) public appointments;

    uint256 public prescriptionCount;
    mapping(uint256 => Prescription) public prescriptions;
    mapping(address => uint256[]) internal patientPrescriptionIds;

    uint256 public medicineCount;
    mapping(uint256 => Medicine) public medicines;

    uint256 public orderCount;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) internal patientOrderIds;

    address[] internal patientList;
    address[] internal doctorList;

    event PatientRegistered(address indexed patient, string name);
    event DoctorRegistered(address indexed doctor, string name);
    event DoctorApproved(address indexed doctor, bool approved);
    event AppointmentBooked(
        uint256 indexed id,
        address indexed patient,
        address indexed doctor
    );
    event AppointmentStatusUpdated(uint256 indexed id, AppointmentStatus status);
    event PrescriptionIssued(
        uint256 indexed id,
        address indexed patient,
        address indexed doctor
    );
    event MedicineAdded(uint256 indexed id, string name, uint256 priceWei);
    event MedicineActiveSet(uint256 indexed id, bool active);
    event OrderPlaced(uint256 indexed id, address indexed patient, uint256 totalWei);
    event OrderStatusUpdated(uint256 indexed id, OrderStatus status);
    event AdminWithdrawal(address indexed to, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Healthcare: not admin");
        _;
    }

    modifier onlyApprovedDoctor() {
        Doctor storage d = doctors[msg.sender];
        require(d.exists && d.approved, "Healthcare: not approved doctor");
        _;
    }

    modifier onlyPatient() {
        require(patients[msg.sender].exists, "Healthcare: not patient");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerPatient(
        string calldata name,
        uint8 age,
        string calldata recordCid
    ) external {
        require(!patients[msg.sender].exists, "Healthcare: patient exists");
        patients[msg.sender] = Patient(true, name, age, recordCid);
        patientList.push(msg.sender);
        emit PatientRegistered(msg.sender, name);
    }

    function registerDoctor(
        string calldata name,
        string calldata specialization,
        string calldata licenseCid
    ) external {
        require(!doctors[msg.sender].exists, "Healthcare: doctor exists");
        doctors[msg.sender] = Doctor(true, false, name, specialization, licenseCid);
        doctorList.push(msg.sender);
        emit DoctorRegistered(msg.sender, name);
    }

    function setDoctorApproved(address doctor, bool approved) external onlyAdmin {
        require(doctors[doctor].exists, "Healthcare: no doctor");
        doctors[doctor].approved = approved;
        emit DoctorApproved(doctor, approved);
    }

    function bookAppointment(
        address doctor,
        uint256 dateTime,
        string calldata reasonCid
    ) external onlyPatient returns (uint256 id) {
        Doctor storage d = doctors[doctor];
        require(d.exists && d.approved, "Healthcare: invalid doctor");
        appointmentCount += 1;
        id = appointmentCount;
        appointments[id] = Appointment(
            id,
            msg.sender,
            doctor,
            dateTime,
            reasonCid,
            AppointmentStatus.Pending
        );
        emit AppointmentBooked(id, msg.sender, doctor);
    }

    function updateAppointmentStatus(
        uint256 appointmentId,
        AppointmentStatus status
    ) external {
        Appointment storage a = appointments[appointmentId];
        require(a.id != 0, "Healthcare: no appointment");
        require(
            msg.sender == a.doctor || msg.sender == a.patient || msg.sender == admin,
            "Healthcare: unauthorized"
        );
        a.status = status;
        emit AppointmentStatusUpdated(appointmentId, status);
    }

    function issuePrescription(
        address patient,
        string calldata detailsCid
    ) external onlyApprovedDoctor returns (uint256 id) {
        require(patients[patient].exists, "Healthcare: no patient");
        prescriptionCount += 1;
        id = prescriptionCount;
        prescriptions[id] = Prescription(
            id,
            patient,
            msg.sender,
            detailsCid,
            block.timestamp
        );
        patientPrescriptionIds[patient].push(id);
        emit PrescriptionIssued(id, patient, msg.sender);
    }

    function addMedicine(
        string calldata name,
        uint256 priceWei,
        string calldata metadataCid
    ) external onlyAdmin returns (uint256 id) {
        medicineCount += 1;
        id = medicineCount;
        medicines[id] = Medicine(id, name, priceWei, true, metadataCid);
        emit MedicineAdded(id, name, priceWei);
    }

    function setMedicineActive(uint256 medicineId, bool active) external onlyAdmin {
        require(medicines[medicineId].id != 0, "Healthcare: no medicine");
        medicines[medicineId].active = active;
        emit MedicineActiveSet(medicineId, active);
    }

    function placeOrder(
        uint256 medicineId,
        uint256 quantity
    ) external payable onlyPatient returns (uint256 id) {
        Medicine storage m = medicines[medicineId];
        require(m.id != 0 && m.active, "Healthcare: invalid medicine");
        require(quantity > 0, "Healthcare: bad quantity");
        uint256 total = m.priceWei * quantity;
        require(msg.value >= total, "Healthcare: insufficient payment");

        orderCount += 1;
        id = orderCount;
        orders[id] = Order(
            id,
            msg.sender,
            medicineId,
            quantity,
            total,
            OrderStatus.Placed,
            block.timestamp
        );
        patientOrderIds[msg.sender].push(id);

        uint256 change = msg.value - total;
        if (change > 0) {
            (bool ok, ) = payable(msg.sender).call{value: change}("");
            require(ok, "Healthcare: refund failed");
        }

        emit OrderPlaced(id, msg.sender, total);
    }

    function updateOrderStatus(uint256 orderId, OrderStatus status) external onlyAdmin {
        require(orders[orderId].id != 0, "Healthcare: no order");
        orders[orderId].status = status;
        emit OrderStatusUpdated(orderId, status);
    }

    function adminWithdraw() external onlyAdmin {
        uint256 bal = address(this).balance;
        require(bal > 0, "Healthcare: empty");
        (bool ok, ) = payable(admin).call{value: bal}("");
        require(ok, "Healthcare: withdraw failed");
        emit AdminWithdrawal(admin, bal);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Healthcare: zero admin");
        admin = newAdmin;
    }

    function getPatientCount() external view returns (uint256) {
        return patientList.length;
    }

    function getDoctorCount() external view returns (uint256) {
        return doctorList.length;
    }

    function getPatientAt(uint256 index) external view returns (address) {
        return patientList[index];
    }

    function getDoctorAt(uint256 index) external view returns (address) {
        return doctorList[index];
    }

    function isPatient(address account) external view returns (bool) {
        return patients[account].exists;
    }

    function isApprovedDoctor(address account) external view returns (bool) {
        Doctor storage d = doctors[account];
        return d.exists && d.approved;
    }

    function getPatientPrescriptionIds(
        address patient
    ) external view returns (uint256[] memory) {
        return patientPrescriptionIds[patient];
    }

    function getPatientOrderIds(address patient) external view returns (uint256[] memory) {
        return patientOrderIds[patient];
    }
}
