
// run when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  // determine the API path based on the server
  // use local PHP folder for localhost, use remote path for betaweb
  const API_BASE = window.location.hostname === "localhost"
    ? "PHP/"
    : "/~oluo/PHP/";

  // helper to build full API URLs
  const apiPath = (fileName) => `${API_BASE}${fileName}`;

  // read query parameters from the URL (e.g., ?doctor_id=D001)
  const params = new URLSearchParams(window.location.search);

  // helper to fetch JSON from a PHP endpoint
  // wraps the native fetch API with error handling for non-JSON responses and HTTP errors
  const fetchJSON = async (url, options = {}) => {
    // make the HTTP request (defaults to GET if options.method is not specified)
    const res = await fetch(url, options);
    // get the response as raw text (need to check if it's JSON first)
    const text = await res.text();

    let data;

    // try to parse the text as JSON
    try {
      data = JSON.parse(text);
    } catch (err) {
      // if parsing fails, the server likely returned an HTML error page or PHP notice
      console.error(`Non-JSON response from ${url}:`, text);
      throw new Error(`Server returned HTML/PHP error instead of JSON. Check ${url}.`);
    }

    // Check if the HTTP response was successful (status 200-299)
    // If not, throw an error with the server's error message if available
    if (!res.ok) {
      throw new Error(data.error || data.details || `Request failed for ${url}`);
    }

    // Return the parsed JSON data
    return data;
  };

  // prevent XSS attacks by escaping HTML special characters
  const escapeHtml = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // convert a datetime or date string into the form of YYYY-MM-DD
  // used for HTML date input fields
  const toDateInputValue = (value) => {
    if (!value) return "";
    return String(value).slice(0, 10);
  };

  // convert a datetime string into the form of HH:MM
  // used for HTML time input fields
  const toTimeInputValue = (value) => {
    if (!value) return "";
    const str = String(value);
    return str.length >= 16 ? str.slice(11, 16) : "";
  };

  // convert a datetime string into the form needed for datetime-local input
  // converts "2026-04-19 12:30:00" to "2026-04-19T12:30"
  const toDatetimeLocalValue = (value) => {
    if (!value) return "";
    return String(value).replace(" ", "T").slice(0, 16);
  };

  // return the CSS class for a patient status badge
  const badgeClassForStatus = (status) => {
    if (status == "Critical") return "danger";
    if (status == "Stable") return "success";
    if (status == "Recovering") return "warning";
    return "";
  };

  // fetch departments from the API and populate a dropdown select element
  const loadDepartmentOptions = async (selectId, selectedValue = "") => {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
      const departments = await fetchJSON(apiPath("department_api.php"));
      select.innerHTML = `<option value="">Select department</option>`;

      departments.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.department_id;
        opt.textContent = `${d.department_id} • ${d.department_name}`;
        if (d.department_id === selectedValue) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    } catch (err) {
      console.error("Department load error:", err);
    }
  };

  // fetch rooms from the API and populate a dropdown
  // only shows rooms in the selected department that have available beds
  const loadRoomOptionsByDepartment = async (selectId, departmentId, selectedRoom = "") => {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="">Choose available room</option>`;

    if (!departmentId) {
      select.innerHTML = `<option value="">Select department first</option>`;
      return;
    }

    try {
      const rooms = await fetchJSON(apiPath("room_api.php"));
      const filtered = rooms.filter((r) => {
        const sameDepartment = r.department_id === departmentId;
        const hasCapacity = Number(r.occupied) < Number(r.beds_count);
        const isCurrentRoom = r.room_num === selectedRoom;
        return sameDepartment && (hasCapacity || isCurrentRoom);
      });

      select.innerHTML = `<option value="">Choose available room</option>`;

      filtered.forEach((r) => {
        const opt = document.createElement("option");
        opt.value = r.room_num;
        opt.textContent = `${r.room_num} (${r.room_type})`;
        if (r.room_num === selectedRoom) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    } catch (err) {
      console.error("Room load error:", err);
      select.innerHTML = `<option value="">Error loading rooms</option>`;
    }
  };

  // toggle advance search sections open/closed
  document.querySelectorAll("[data-advanced-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.advancedToggle);
      if (!target) return;
      target.classList.toggle("open");
    });
  });

  // handle tab switching (i.e., in the doctor/nurse tabs)
  document.querySelectorAll("[data-tab-group]").forEach((group) => {
    const buttons = group.querySelectorAll("[data-tab]");
    const panels = document.querySelectorAll(
      `[data-panel-group="${group.dataset.tabGroup}"]`
    );

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // turn off all tab buttons
        buttons.forEach((b) => b.classList.remove("active"));

        // turn on the clicked one
        btn.classList.add("active");

        // show the matching panel and hide the others
        panels.forEach((panel) => {
          panel.classList.toggle("active", panel.dataset.panel === btn.dataset.tab);
        });
      });
    });
  });

  // autofill the "time admitted" field with the current local date and time (if field is empty)
  const timeField = document.querySelector("[data-fill-now]");
  if (timeField && !timeField.value) {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    timeField.value = local;
  }

  // REPORTS PAGE preview logic here:
  // const reportSelect = document.getElementById("reportPreset");
  // const reportOutput = document.getElementById("reportOutput");
  // if (reportSelect && reportOutput) {
  //   const reportSamples = {
  //     rooms: `
  //       <table>
  //         <thead>
  //           <tr><th>Department</th><th>Available Rooms</th><th>Open Beds</th></tr>
  //         </thead>
  //         <tbody>
  //           <tr><td>Cardiology</td><td>5</td><td>8</td></tr>
  //           <tr><td>Emergency</td><td>2</td><td>3</td></tr>
  //           <tr><td>ICU</td><td>1</td><td>1</td></tr>
  //         </tbody>
  //       </table>`,
  //     admitted: `
  //       <table>
  //         <thead>
  //           <tr><th>Department</th><th>Patients Admitted</th></tr>
  //         </thead>
  //         <tbody>
  //           <tr><td>Cardiology</td><td>16</td></tr>
  //           <tr><td>Emergency</td><td>11</td></tr>
  //           <tr><td>Pediatrics</td><td>9</td></tr>
  //         </tbody>
  //       </table>`,
  //     occupancy: `
  //       <table>
  //         <thead>
  //           <tr><th>Room Type</th><th>Total Rooms</th><th>Occupied</th><th>Occupancy Rate</th></tr>
  //         </thead>
  //         <tbody>
  //           <tr><td>Standard</td><td>20</td><td>14</td><td>70%</td></tr>
  //           <tr><td>ICU</td><td>6</td><td>5</td><td>83%</td></tr>
  //           <tr><td>VIP</td><td>4</td><td>2</td><td>50%</td></tr>
  //         </tbody>
  //       </table>`,
  //     patientcount: `
  //       <table>
  //         <thead>
  //           <tr><th>Department</th><th>Patient Count</th></tr>
  //         </thead>
  //         <tbody>
  //           <tr><td>Cardiology</td><td>16</td></tr>
  //           <tr><td>Oncology</td><td>12</td></tr>
  //           <tr><td>Emergency</td><td>11</td></tr>
  //         </tbody>
  //       </table>`
  //   };

  //   const renderReport = () => {
  //     const key = reportSelect.value;
  //     reportOutput.innerHTML =
  //       reportSamples[key] ||
  //       '<div class="empty-state">Select a preset report to preview the output table.</div>';
  //   };

  //   reportSelect.addEventListener("change", renderReport);
  //   renderReport();
  // }

  // LOGIN FORM BEHAVIOUR

  // map each role to the page they should see after logging in
  const ROLE_HOME = {
    Admin: "admin_dashboard.html",
    Doctor: "patient_lookup.html",
    Nurse: "patient_lookup.html"
  };

  // define which roles can access which pages
  const PAGE_ACCESS = {
    "index.html": ["Guest", "Admin", "Doctor", "Nurse"],
    "admin_dashboard.html": ["Admin"],
    "staff_management.html": ["Admin"],
    "add_doctor.html": ["Admin"],
    "add_nurse.html": ["Admin"],
    "room_management.html": ["Admin"],
    "add_room.html": ["Admin"],
    "departments_management.html": ["Admin"],
    "add_department.html": ["Admin"],
    "patient_lookup.html": ["Admin", "Doctor", "Nurse"],
    "patient_details.html": ["Admin", "Doctor", "Nurse"],
    "admit_patient.html": ["Admin", "Doctor"]
  };

  // get the current page filename from the URL
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // get the redirect page for a given role
  const getRoleHome = (role) => ROLE_HOME[role] || "index.html";

  // check if the user is logged in by calling the session API
  const getSession = async () => {
    try {
      const res = await fetch(apiPath("session_api.php"), {
        credentials: "same-origin"
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (!data.logged_in) return null;

      return {
        userId: data.user_id,
        role: data.role
      };
    } catch (err) {
      console.error("Session check error:", err);
      return null;
    }
  };

  const updateUserChip = (session) => {
    const chip = document.querySelector(".user-chip");
    if (!chip) return;

    const avatar = chip.querySelector(".avatar");
    const divs = chip.querySelectorAll("div");
    const label = divs.length > 1 ? divs[1] : null;

    if (!session) {
      if (avatar) avatar.textContent = "?";
      if (label) label.textContent = "Guest";
      return;
    }

    if (avatar) avatar.textContent = session.role.charAt(0).toUpperCase();
    if (label) label.textContent = `${session.role} • ${session.userId}`;
  };

  // update the navigation menu based on the user's role
  // hides links that the user is not allowed to access
  const updateNavForRole = (session) => {
    const role = session?.role || "Guest";

    document.querySelectorAll(".main-nav .nav-link").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;

      const allowedRoles = PAGE_ACCESS[href];
      if (!allowedRoles) return;

      link.style.display = allowedRoles.includes(role) ? "" : "none";
    });

    const toggleDisplay = (selector, show) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.display = show ? "" : "none";
      });
    };

    const isAdmin = role === "Admin";
    const isDoctor = role === "Doctor";

    // show admin-only pages
    toggleDisplay(
      'a[href="staff_management.html"], a[href="add_doctor.html"], a[href="add_nurse.html"], a[href="room_management.html"], a[href="add_room.html"], a[href="departments_management.html"], a[href="add_department.html"], a[href="admin_dashboard.html"]',
      isAdmin
    );

    // show admit patient page for admin and doctor
    toggleDisplay('a[href="admit_patient.html"]', isAdmin || isDoctor);
  };

  // check if the user is allowed to access the current page
  // redirect to appropriate page if not allowed
  const handleAccessControl = async () => {
    const session = await getSession();

    if (currentPage === "index.html") {
      if (session) {
        window.location.href = getRoleHome(session.role);
        return true;
      }
      return false;
    }

    if (!session) {
      window.location.href = "index.html";
      return true;
    }

    const allowedRoles = PAGE_ACCESS[currentPage];
    if (allowedRoles && !allowedRoles.includes(session.role)) {
      window.location.href = getRoleHome(session.role);
      return true;
    }

    return false;
  };

  // set up the login form submission handler
  const setupLoginForm = () => {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const userId = document.getElementById("userId")?.value.trim();
      const password = document.getElementById("password")?.value.trim();
      const role = document.getElementById("role")?.value;

      if (!userId || !password || !role) {
        alert("Please enter a user ID, password, and role.");
        return;
      }

      try {
        const res = await fetch(apiPath("login_api.php"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "same-origin",
          body: JSON.stringify({ userId, password, role })
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Login failed");
        }

        window.location.href = getRoleHome(result.role);
      } catch (err) {
        console.error("Login error:", err);
        alert(err.message);
      }
    });
  };

  // set up the logout link handler
  const setupLogout = () => {
    document.querySelectorAll('.user-chip a[href="index.html"]').forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();

        try {
          await fetch(apiPath("logout_api.php"), {
            method: "POST",
            credentials: "same-origin"
          });
        } catch (err) {
          console.error("Logout error:", err);
        }

        window.location.href = "index.html";
      });
    });
  };

  setupLoginForm();

  if (await handleAccessControl()) return;

  const session = await getSession();
  updateUserChip(session);
  updateNavForRole(session);
  setupLogout();

  // load the admin dashboard data if on that page
  const loadAdminDashboard = async () => {
    const dashboardTable = document.getElementById("departmentStatsBody");

    if (!dashboardTable) return;

    try {
      const data = await fetchJSON(apiPath("admin_dashboard_api.php"));

      if (!data.success) {
        throw new Error(data.error || "Could not load dashboard data.");
      }

      document.getElementById("totalPatients").textContent = data.summary.total_patients;
      document.getElementById("bedsFilled").textContent = data.summary.beds_filled;
      document.getElementById("bedsAvailable").textContent = data.summary.beds_available;
      document.getElementById("totalDoctors").textContent = data.summary.total_doctors;

      let html = "";

      data.departments.forEach((d) => {
        html += `
        <tr>
          <td>${escapeHtml(d.department_name)}</td>
          <td>${escapeHtml(d.patient_count)}</td>
          <td>${escapeHtml(d.open_beds)}</td>
        </tr>
      `;
      });

      dashboardTable.innerHTML = html || `
      <tr>
        <td colspan="3">No department data found.</td>
      </tr>
    `;
    } catch (err) {
      console.error("Admin dashboard load error:", err);

      dashboardTable.innerHTML = `
      <tr>
        <td colspan="3">Unable to load dashboard data.</td>
      </tr>
    `;
    }
  };

  await loadAdminDashboard();

  // --------------
  // TABLE LOADING SECTIONS WITH SEARCH/FILTERS

  // helper for case-insensitive text search
  const includesText = (value, search) => {
    return String(value ?? "")
      .toLowerCase()
      .includes(String(search ?? "").trim().toLowerCase());
  };

  // check if the current user is an admin
  const isAdmin = session?.role === "Admin";

  // function that creates a Delete button HTML string
  // only renders for admin users
  const adminDeleteButton = (type, id, label) => {
    if (!isAdmin) return "";

    return `
    <button 
      class="btn btn-outline"
      type="button"
      data-delete-type="${escapeHtml(type)}"
      data-delete-id="${escapeHtml(id)}"
      data-delete-label="${escapeHtml(label)}"
    >
      Delete
    </button>
  `;
  };

  // click handler for delete buttons
  // uses event delegation on the document
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-delete-type]");
    if (!btn) return;

    // extract data
    const type = btn.dataset.deleteType;
    const id = btn.dataset.deleteId;
    const label = btn.dataset.deleteLabel;

    const confirmed = confirm(`Are you sure you want to delete ${label}?`);

    if (!confirmed) return;

    // DELETE request: Send POST to delete_api.php with type and id in the request body
    try {
      const result = await fetchJSON(apiPath("delete_api.php"), {
        method: "POST",  // POST request
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({ type, id })  // data sent in request body, not URL
      });

      alert(result.message || "Deleted successfully.");
      window.location.reload();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.message);
    }
  });

  // fills search dropdowns with real department IDs from the database
  const loadDepartmentSearchOptions = async (selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
      const departments = await fetchJSON(apiPath("department_api.php"));

      select.innerHTML = `<option value="">All departments</option>`;

      departments.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.department_id;
        opt.textContent = `${d.department_id} • ${d.department_name}`;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error("Department search dropdown load error:", err);
    }
  };

  // load search department dropdowns if they exist on the current page
  await loadDepartmentSearchOptions("lookupDepartment");
  await loadDepartmentSearchOptions("staffDept");
  await loadDepartmentSearchOptions("roomDeptSearch");

  // ------------------
  // DOCTOR TABLE WITH FILTERS

  const doctorTable = document.getElementById("doctorTable");
  let allDoctors = [];

  const renderDoctors = (doctors) => {
    if (!doctorTable) return;

    let html = "";

    doctors.forEach((d) => {
      const onShift = d.is_on_shift === "1" || d.is_on_shift === 1 ? "Yes" : "No";

      html += `
        <tr>
          <td>${escapeHtml(d.first_name)}</td>
          <td>${escapeHtml(d.last_name)}</td>
          <td>${escapeHtml(d.doctor_id)}</td>
          <td>${escapeHtml(d.department_id)}</td>
          <td>${escapeHtml(d.shift_start)}</td>
          <td>${escapeHtml(d.shift_end)}</td>
          <td>${onShift}</td>
          <td>
            <a class="btn btn-outline" href="add_doctor.html?doctor_id=${encodeURIComponent(d.doctor_id)}">
              Edit
            </a>
            ${adminDeleteButton("doctor", d.doctor_id, `doctor ${d.first_name} ${d.last_name}`)}
          </td>
        </tr>
      `;
    });

    doctorTable.innerHTML = html || `
      <tr>
        <td colspan="8">No doctors found.</td>
      </tr>
    `;
  };

  const applyStaffFilters = () => {
    const first = document.getElementById("staffFirst")?.value || "";
    const last = document.getElementById("staffLast")?.value || "";
    const dept = document.getElementById("staffDept")?.value || "";

    const filteredDoctors = allDoctors.filter((d) => {
      return (
        includesText(d.first_name, first) &&
        includesText(d.last_name, last) &&
        (!dept || d.department_id === dept)
      );
    });

    const filteredNurses = allNurses.filter((n) => {
      return (
        includesText(n.first_name, first) &&
        includesText(n.last_name, last) &&
        (!dept || n.department_id === dept)
      );
    });

    renderDoctors(filteredDoctors);
    renderNurses(filteredNurses);
  };

  if (doctorTable) {
    fetch(apiPath("doctor_api.php"))
      .then((res) => res.json())
      .then((data) => {
        allDoctors = data;
        applyStaffFilters();
      })
      .catch((err) => console.error("Doctor load error:", err));
  }

  // ------------------
  // NURSE TABLE WITH FILTERS

  const nurseTable = document.getElementById("nurseTable");
  let allNurses = [];

  const renderNurses = (nurses) => {
    if (!nurseTable) return;

    let html = "";

    nurses.forEach((n) => {
      const onShift = n.is_on_shift === "1" || n.is_on_shift === 1 ? "Yes" : "No";

      html += `
        <tr>
          <td>${escapeHtml(n.first_name)}</td>
          <td>${escapeHtml(n.last_name)}</td>
          <td>${escapeHtml(n.nurse_id)}</td>
          <td>${escapeHtml(n.department_id)}</td>
          <td>${escapeHtml(n.shift_start)}</td>
          <td>${escapeHtml(n.shift_end)}</td>
          <td>${onShift}</td>
          <td>
            <a class="btn btn-outline" href="add_nurse.html?nurse_id=${encodeURIComponent(n.nurse_id)}">
              Edit
            </a>
            ${adminDeleteButton("nurse", n.nurse_id, `nurse ${n.first_name} ${n.last_name}`)}
          </td>
        </tr>
      `;
    });

    nurseTable.innerHTML = html || `
      <tr>
        <td colspan="8">No nurses found.</td>
      </tr>
    `;
  };

  if (nurseTable) {
    fetch(apiPath("nurse_api.php"))
      .then((res) => res.json())
      .then((data) => {
        allNurses = data;
        applyStaffFilters();
      })
      .catch((err) => console.error("Nurse load error:", err));
  }

  // staff filter event listeners
  ["staffFirst", "staffLast", "staffDept"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", applyStaffFilters);
    el.addEventListener("change", applyStaffFilters);
  });

  const staffSearchBtn = document
    .getElementById("staffFirst")
    ?.closest(".search-grid")
    ?.querySelector('button[type="button"]');

  if (staffSearchBtn) {
    staffSearchBtn.addEventListener("click", applyStaffFilters);
  }

  // ------------------
  // PATIENT TABLE WITH FILTERS

  const patientTable = document.getElementById("patientTable");
  let allPatients = [];

  const renderPatients = (patients) => {
    if (!patientTable) return;

    let html = "";

    patients.forEach((p) => {
      const statusClass = badgeClassForStatus(p.status);

      html += `
        <tr>
          <td>${escapeHtml(p.patient_id)}</td>
          <td>${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</td>
          <td>${escapeHtml(p.department_id)}</td>
          <td>${escapeHtml(p.room_num)}</td>
          <td>${escapeHtml(p.illness)}</td>
          <td>
            <span class="badge ${statusClass}">
              ${escapeHtml(p.status)}
            </span>
          </td>
          <td>${escapeHtml(p.time_admitted)}</td>
          <td>
            <a class="btn btn-outline" href="patient_details.html?patient_id=${encodeURIComponent(p.patient_id)}">
              View
            </a>
            ${adminDeleteButton("patient", p.patient_id, `patient ${p.first_name} ${p.last_name}`)}
          </td>
        </tr>
      `;
    });

    patientTable.innerHTML = html || `
      <tr>
        <td colspan="8">No patients found.</td>
      </tr>
    `;
  };

  const applyPatientFilters = () => {
    const first = document.getElementById("lookupFirst")?.value || "";
    const last = document.getElementById("lookupLast")?.value || "";
    const dept = document.getElementById("lookupDepartment")?.value || "";
    const patientId = document.getElementById("lookupPatientId")?.value || "";
    const room = document.getElementById("lookupRoom")?.value || "";
    const contact = document.getElementById("lookupContact")?.value || "";
    const illness = document.getElementById("lookupIllness")?.value || "";

    const filtered = allPatients.filter((p) => {
      return (
        includesText(p.first_name, first) &&
        includesText(p.last_name, last) &&
        (!dept || p.department_id === dept) &&
        includesText(p.patient_id, patientId) &&
        includesText(p.room_num, room) &&
        includesText(p.contact_info, contact) &&
        includesText(p.illness, illness)
      );
    });

    renderPatients(filtered);
  };

  if (patientTable) {
    fetch(apiPath("patient_api.php"))
      .then((res) => res.json())
      .then((data) => {
        allPatients = data;
        applyPatientFilters();
      })
      .catch((err) => console.error("Patient load error:", err));
  }

  [
    "lookupFirst",
    "lookupLast",
    "lookupDepartment",
    "lookupPatientId",
    "lookupRoom",
    "lookupContact",
    "lookupIllness"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", applyPatientFilters);
    el.addEventListener("change", applyPatientFilters);
  });

  const patientSearchBtn = document
    .getElementById("lookupFirst")
    ?.closest(".search-grid")
    ?.querySelector('button[type="button"]');

  if (patientSearchBtn) {
    patientSearchBtn.addEventListener("click", applyPatientFilters);
  }

  // ------------------
  // DEPARTMENT TABLE WITH FILTERS

  const deptTable = document.getElementById("deptTable");
  let allDepartments = [];

  const renderDepartments = (departments) => {
    if (!deptTable) return;

    let html = "";

    departments.forEach((d) => {
      html += `
        <tr>
          <td>${escapeHtml(d.department_id)}</td>
          <td>${escapeHtml(d.department_name)}</td>
          <td>${escapeHtml(d.department_location)}</td>
          <td>${escapeHtml(d.beds_total)}</td>
          <td>${escapeHtml(d.patient_count)}</td>
          <td>
            <a class="btn btn-outline" href="add_department.html?department_id=${encodeURIComponent(d.department_id)}">
              Edit
            </a>
            ${adminDeleteButton("department", d.department_id, `department ${d.department_name}`)}
          </td>
        </tr>
      `;
    });

    deptTable.innerHTML = html || `
      <tr>
        <td colspan="6">No departments found.</td>
      </tr>
    `;
  };

  const applyDepartmentFilters = () => {
    const id = document.getElementById("deptIdSearch")?.value || "";
    const name = document.getElementById("deptNameSearch")?.value || "";
    const location = document.getElementById("deptLocationSearch")?.value || "";

    const filtered = allDepartments.filter((d) => {
      return (
        includesText(d.department_id, id) &&
        includesText(d.department_name, name) &&
        includesText(d.department_location, location)
      );
    });

    renderDepartments(filtered);
  };

  if (deptTable) {
    fetch(apiPath("department_api.php"))
      .then((res) => res.json())
      .then((data) => {
        allDepartments = data;
        applyDepartmentFilters();
      })
      .catch((err) => console.error("Department load error:", err));
  }

  ["deptIdSearch", "deptNameSearch", "deptLocationSearch"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", applyDepartmentFilters);
    el.addEventListener("change", applyDepartmentFilters);
  });

  const deptSearchBtn = document
    .getElementById("deptIdSearch")
    ?.closest(".search-grid")
    ?.querySelector('button[type="button"]');

  if (deptSearchBtn) {
    deptSearchBtn.addEventListener("click", applyDepartmentFilters);
  }

  // ------------------
  // ROOM TABLE WITH FILTERS

  const roomTable = document.getElementById("roomTable");
  let allRooms = [];

  const getRoomStatus = (room) => {
    const beds = Number(room.beds_count) || 0;
    const occupied = Number(room.occupied) || 0;

    if (beds > 0 && occupied >= beds) return "Full";
    if (occupied === 0) return "Empty";
    return "Partial";
  };

  const renderRooms = (rooms) => {
    if (!roomTable) return;

    let html = "";

    rooms.forEach((r) => {
      const beds = Number(r.beds_count) || 0;
      const occupied = Number(r.occupied) || 0;
      const status = getRoomStatus(r);

      html += `
        <tr>
          <td>${escapeHtml(r.room_num)}</td>
          <td>${escapeHtml(r.department_id)}</td>
          <td>${escapeHtml(r.room_type)}</td>
          <td>${status}</td>
          <td>${beds}</td>
          <td>${occupied}</td>
          <td>${escapeHtml(r.last_cleaned ?? "-")}</td>
          <td>
            <a class="btn btn-outline" href="add_room.html?room_num=${encodeURIComponent(r.room_num)}">
              Edit
            </a>
            ${adminDeleteButton("room", r.room_num, `room ${r.room_num}`)}
          </td>
        </tr>
      `;
    });

    roomTable.innerHTML = html || `
      <tr>
        <td colspan="8">No rooms found.</td>
      </tr>
    `;
  };

  const applyRoomFilters = () => {
    const roomNum = document.getElementById("roomNumSearch")?.value || "";
    const dept = document.getElementById("roomDeptSearch")?.value || "";
    const filled = document.getElementById("roomFilledSearch")?.value || "";

    const filtered = allRooms.filter((r) => {
      const beds = Number(r.beds_count) || 0;
      const occupied = Number(r.occupied) || 0;
      const isFull = beds > 0 && occupied >= beds;

      return (
        includesText(r.room_num, roomNum) &&
        (!dept || r.department_id === dept) &&
        (
          !filled ||
          (filled === "Yes" && isFull) ||
          (filled === "No" && !isFull)
        )
      );
    });

    renderRooms(filtered);
  };

  if (roomTable) {
    fetch(apiPath("room_api.php"))
      .then((res) => res.json())
      .then((data) => {
        allRooms = data;
        applyRoomFilters();
      })
      .catch((err) => console.error("Room load error:", err));
  }

  ["roomNumSearch", "roomDeptSearch", "roomFilledSearch"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", applyRoomFilters);
    el.addEventListener("change", applyRoomFilters);
  });

  const roomSearchBtn = document
    .getElementById("roomNumSearch")
    ?.closest(".search-grid")
    ?.querySelector('button[type="button"]');

  if (roomSearchBtn) {
    roomSearchBtn.addEventListener("click", applyRoomFilters);
  }


  // ADMIT PATIENT FORM
  const admitForm = document.getElementById("admitForm");
  if (admitForm) {
    admitForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Convert date of birth into the format the backend expects.
      const dobRaw = document.getElementById("dob").value;
      const DOB = dobRaw ? `${dobRaw} 00:00:00` : null;

      // Build the patient object from the form fields.
      const patient = {
        patient_id: document.getElementById("patientId").value,
        room_num: document.getElementById("roomNumber").value,
        first_name: document.getElementById("patientFirstName").value,
        last_name: document.getElementById("patientLastName").value,
        contact_info: document.getElementById("contactInfo").value,
        gender: document.getElementById("gender").value,
        DOB,
        illness: document.getElementById("illness").value,
        time_admitted: document.getElementById("timeAdmitted").value,
        status: document.getElementById("status").value,
        insurance: document.getElementById("insurance").value,
        insurance_num: document.getElementById("insuranceNum").value,
        height: document.getElementById("height").value || null,
        weight: document.getElementById("weight").value || null
      };

      // Make sure a room was chosen.
      if (!patient.room_num) {
        alert("Please select a room");
        return;
      }

      try {
        const res = await fetch(apiPath("patientadmit_api.php"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(patient)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Insert failed");
        }

        alert("Patient admitted successfully!");
        window.location.href = "patient_lookup.html";
      } catch (err) {
        console.error("Admit error:", err);
        alert(err.message);
      }
    });
  }

  // DOCTOR ADD AND EDIT FORM
  const doctorForm = document.getElementById("doctorForm");
  if (doctorForm) {
    const doctorIdParam = params.get("doctor_id");

    // If doctor_id exists in the URL, this page is in edit mode.
    // Load all doctors, find the matching one, and prefill the form.
    if (doctorIdParam) {
      fetchJSON(apiPath("doctor_api.php"))
        .then((data) => {
          const doctor = data.find((d) => d.doctor_id === doctorIdParam);
          if (!doctor) return;

          document.getElementById("doctorId").value = doctor.doctor_id || "";
          document.getElementById("doctorId").readOnly = true; // lock primary key during edit
          document.getElementById("doctorLicense").value = doctor.license_num || "";
          document.getElementById("doctorFirst").value = doctor.first_name || "";
          document.getElementById("doctorLast").value = doctor.last_name || "";
          document.getElementById("doctorContact").value = doctor.contact_num || "";
          document.getElementById("doctorDept").value = doctor.department_id || "";
          document.getElementById("doctorShiftStart").value = toTimeInputValue(doctor.shift_start);
          document.getElementById("doctorShiftEnd").value = toTimeInputValue(doctor.shift_end);
          document.getElementById("doctorOnShift").value = doctor.is_on_shift === "1" ? "Yes" : "No";
        })
        .catch((err) => console.error("Doctor prefill error:", err));
    }

    doctorForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const doctor = {
        mode: doctorIdParam ? "edit" : "add",
        doctor_id: document.getElementById("doctorId").value,
        license_num: document.getElementById("doctorLicense").value,
        first_name: document.getElementById("doctorFirst").value,
        last_name: document.getElementById("doctorLast").value,
        contact_num: document.getElementById("doctorContact").value || null,
        department_id: document.getElementById("doctorDept").value,
        shift_start: document.getElementById("doctorShiftStart").value
          ? `2026-04-19 ${document.getElementById("doctorShiftStart").value}:00`
          : null,
        shift_end: document.getElementById("doctorShiftEnd").value
          ? `2026-04-19 ${document.getElementById("doctorShiftEnd").value}:00`
          : null,
        is_on_shift: document.getElementById("doctorOnShift").value === "Yes" ? 1 : 0
      };

      if (!doctor.department_id) {
        alert("Please select a department");
        return;
      }

      try {
        const res = await fetch(apiPath("doctoradd_api.php"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(doctor)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Save failed");
        }

        alert(doctorIdParam ? "Doctor updated successfully!" : "Doctor added successfully!");
        window.location.href = "staff_management.html";
      } catch (err) {
        console.error("Doctor save error:", err);
        alert(err.message);
      }
    });
  }

  // NURSE ADD AND EDIT FORM
  const nurseForm = document.getElementById("nurseForm");
  if (nurseForm) {
    const nurseIdParam = params.get("nurse_id");

    if (nurseIdParam) {
      fetchJSON(apiPath("nurse_api.php"))
        .then((data) => {
          const nurse = data.find((n) => n.nurse_id === nurseIdParam);
          if (!nurse) return;

          document.getElementById("nurseId").value = nurse.nurse_id || "";
          document.getElementById("nurseId").readOnly = true;
          document.getElementById("nurseLicense").value = nurse.license_num || "";
          document.getElementById("nurseFirst").value = nurse.first_name || "";
          document.getElementById("nurseLast").value = nurse.last_name || "";
          document.getElementById("nurseContact").value = nurse.contact_num || "";
          document.getElementById("nurseDept").value = nurse.department_id || "";
          document.getElementById("nurseShiftStart").value = toTimeInputValue(nurse.shift_start);
          document.getElementById("nurseShiftEnd").value = toTimeInputValue(nurse.shift_end);
          document.getElementById("nurseOnShift").value = nurse.is_on_shift === "1" ? "Yes" : "No";
        })
        .catch((err) => console.error("Nurse prefill error:", err));
    }

    nurseForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nurse = {
        mode: nurseIdParam ? "edit" : "add",
        nurse_id: document.getElementById("nurseId").value,
        license_num: document.getElementById("nurseLicense").value,
        first_name: document.getElementById("nurseFirst").value,
        last_name: document.getElementById("nurseLast").value,
        contact_num: document.getElementById("nurseContact").value || null,
        department_id: document.getElementById("nurseDept").value,
        shift_start: document.getElementById("nurseShiftStart").value
          ? `2026-04-19 ${document.getElementById("nurseShiftStart").value}:00`
          : null,
        shift_end: document.getElementById("nurseShiftEnd").value
          ? `2026-04-19 ${document.getElementById("nurseShiftEnd").value}:00`
          : null,
        is_on_shift: document.getElementById("nurseOnShift").value === "Yes" ? 1 : 0
      };

      if (!nurse.department_id) {
        alert("Please select a department");
        return;
      }

      try {
        const res = await fetch(apiPath("nurseadd_api.php"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(nurse)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Save failed");
        }

        alert(nurseIdParam ? "Nurse updated successfully!" : "Nurse added successfully!");
        window.location.href = "staff_management.html";
      } catch (err) {
        console.error("Nurse save error:", err);
        alert(err.message);
      }
    });
  }

  // DEPARTMENT ADD AND EDIT FORM
  const deptForm = document.getElementById("deptForm");
  if (deptForm) {
    const departmentIdParam = params.get("department_id");

    if (departmentIdParam) {
      fetchJSON(apiPath("department_api.php"))
        .then((data) => {
          const department = data.find((d) => d.department_id === departmentIdParam);
          if (!department) return;

          document.getElementById("deptId").value = department.department_id || "";
          document.getElementById("deptId").readOnly = true;
          document.getElementById("deptName").value = department.department_name || "";
          document.getElementById("deptLocation").value = department.department_location || "";
          document.getElementById("bedsTotal").value = department.beds_total || "";
        })
        .catch((err) => console.error("Department prefill error:", err));
    }

    deptForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const department = {
        mode: departmentIdParam ? "edit" : "add",
        department_id: document.getElementById("deptId").value,
        department_name: document.getElementById("deptName").value,
        department_location: document.getElementById("deptLocation").value,
        beds_total: Number(document.getElementById("bedsTotal").value)
      };

      if (!department.department_id) {
        alert("Please enter a department ID");
        return;
      }

      if (!department.department_name) {
        alert("Please enter a department name");
        return;
      }

      try {
        const res = await fetch(apiPath("departmentadd_api.php"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(department)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Save failed");
        }

        alert(departmentIdParam ? "Department updated successfully!" : "Department added successfully!");
        window.location.href = "departments_management.html";
      } catch (err) {
        console.error("Department save error:", err);
        alert(err.message);
      }
    });
  }

  // ROOM ADD AND EDIT FORM
  const roomForm = document.getElementById("roomForm");
  if (roomForm) {
    const roomNumParam = params.get("room_num");

    if (roomNumParam) {
      fetchJSON(apiPath("room_api.php"))
        .then((data) => {
          const room = data.find((r) => r.room_num === roomNumParam);
          if (!room) return;

          document.getElementById("roomNum").value = room.room_num || "";
          document.getElementById("roomNum").readOnly = true;
          document.getElementById("roomDept").value = room.department_id || "";
          document.getElementById("roomType").value = room.room_type || "";
          document.getElementById("bedsCount").value = room.beds_count || "";
          document.getElementById("occupied").value = room.occupied || 0;
          document.getElementById("lastCleaned").value = toDatetimeLocalValue(room.last_cleaned);
        })
        .catch((err) => console.error("Room prefill error:", err));
    }

    roomForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const room = {
        mode: roomNumParam ? "edit" : "add",
        room_num: document.getElementById("roomNum").value,
        department_id: document.getElementById("roomDept").value,
        room_type: document.getElementById("roomType").value,
        beds_count: Number(document.getElementById("bedsCount").value),
        occupied: Number(document.getElementById("occupied").value || 0),
        last_cleaned: document.getElementById("lastCleaned")?.value
          ? document.getElementById("lastCleaned").value.replace("T", " ") + ":00"
          : null
      };

      if (!room.department_id) {
        alert("Please select a department");
        return;
      }

      try {
        const res = await fetch(apiPath("roomadd_api.php"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(room)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Save failed");
        }

        alert(roomNumParam ? "Room updated successfully!" : "Room added successfully!");
        window.location.href = "room_management.html";
      } catch (err) {
        console.error("Room save error:", err);
        alert(err.message);
      }
    });
  }

  // ------------------
  // DOCTOR ADD AND EDIT FORM: load department dropdown and then rooms based on chosen department
  const patientDeptSelect = document.getElementById("patientDept");
  const patientRoomSelect = document.getElementById("roomNumber");

  if (patientDeptSelect) {
    loadDepartmentOptions("patientDept");
  }

  if (patientDeptSelect && patientRoomSelect) {
    patientDeptSelect.addEventListener("change", async () => {
      await loadRoomOptionsByDepartment("roomNumber", patientDeptSelect.value);
    });
  }

  // ------------------
  // PATIENT DETAILS PAGE
  const patientDetailsRoot = document.getElementById("patientDetailsRoot");
  if (patientDetailsRoot) {
    const patientIdParam = params.get("patient_id");
    const saveBtn = document.getElementById("patientSaveBtn");
    const detailDept = document.getElementById("detailDepartment");
    const detailRoom = document.getElementById("detailRoom");

    // keep the currently loaded patient in memory
    let currentPatient = null;

    // load the patient's info and fill all the fields
    const fillPatientDetails = async () => {
      if (!patientIdParam) {
        alert("No patient ID was provided.");
        return;
      }

      try {
        const patients = await fetchJSON(apiPath("patient_api.php"));
        const patient = patients.find((p) => String(p.patient_id) === String(patientIdParam));

        if (!patient) {
          alert("Patient not found.");
          return;
        }

        currentPatient = patient;

        // fill header/profile section
        const initials = `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`;
        document.getElementById("patientAvatar").textContent = initials || "?";
        document.getElementById("patientName").textContent = `${patient.first_name} ${patient.last_name}`;
        document.getElementById("patientMeta1").textContent = `Patient ID: ${patient.patient_id}`;
        document.getElementById("patientMeta2").textContent =
          `${patient.gender || ""} • DOB ${toDateInputValue(patient.DOB) || "N/A"} • ${patient.contact_info || "N/A"}`;

        // fill status badge
        const statusBadge = document.getElementById("patientStatusBadge");
        statusBadge.textContent = patient.status || "Unknown";
        statusBadge.className = `badge ${badgeClassForStatus(patient.status)}`.trim();

        // fill summary cards
        document.getElementById("summaryStatus").textContent = patient.status || "N/A";
        document.getElementById("summaryLocation").textContent =
          `${patient.department_id || "Unassigned"} • Room ${patient.room_num || "N/A"}`;
        document.getElementById("summaryInsuranceNumber").textContent = patient.insurance_num || "N/A";
        document.getElementById("summaryHeight").textContent = patient.height ? `${patient.height} ft` : "N/A";
        document.getElementById("summaryWeight").textContent = patient.weight ? `${patient.weight} lb` : "N/A";
        document.getElementById("summaryTimeAdmitted").textContent = patient.time_admitted || "N/A";
        document.getElementById("summaryInsuranceProvider").textContent = patient.insurance || "N/A";

        // fill editable form fields
        document.getElementById("detailIllness").value = patient.illness || "";
        document.getElementById("detailDiagnosis").value = patient.illness || "";
        document.getElementById("detailStatus").value = patient.status || "Admitted";

        // foad department and room options with current values selected
        await loadDepartmentOptions("detailDepartment", patient.department_id || "");
        await loadRoomOptionsByDepartment("detailRoom", patient.department_id, patient.room_num || "");
      } catch (err) {
        console.error("Patient details load error:", err);
        alert("Could not load patient details.");
      }
    };

    // ff the department changes: reload room options for that department.
    if (detailDept && detailRoom) {
      detailDept.addEventListener("change", async () => {
        const currentRoom = currentPatient?.room_num || "";
        await loadRoomOptionsByDepartment("detailRoom", detailDept.value, currentRoom);
      });
    }

    // save button sends the updated data to patientupdate_api.php
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        if (!patientIdParam) return;

        const payload = {
          patient_id: patientIdParam,
          illness: document.getElementById("detailIllness").value,
          status: document.getElementById("detailStatus").value,
          room_num: document.getElementById("detailRoom").value
        };

        if (!payload.room_num) {
          alert("Please choose a room before saving.");
          return;
        }

        try {
          const res = await fetch(apiPath("patientupdate_api.php"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.error || "Update failed");
          }

          alert("Patient updated successfully!");

          // reload the page data after save so the UI reflects the update
          await fillPatientDetails();
        } catch (err) {
          console.error("Patient update error:", err);
          alert(err.message);
        }
      });
    }

    fillPatientDetails();
  }
});