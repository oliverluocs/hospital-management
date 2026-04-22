
document.addEventListener("DOMContentLoaded", () => {
  console.log("admit form:", document.getElementById("admitForm"));
  document.querySelectorAll("[data-advanced-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.advancedToggle);
      if (!target) return;
      target.classList.toggle("open");
    });
  });

  document.querySelectorAll("[data-tab-group]").forEach((group) => {
    const buttons = group.querySelectorAll("[data-tab]");
    const panels = document.querySelectorAll(`[data-panel-group="${group.dataset.tabGroup}"]`);
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        panels.forEach((panel) => {
          panel.classList.toggle("active", panel.dataset.panel === btn.dataset.tab);
        });
      });
    });
  });

  const timeField = document.querySelector("[data-fill-now]");
  if (timeField && !timeField.value) {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    timeField.value = local;
  }

  const reportSelect = document.getElementById("reportPreset");
  const reportOutput = document.getElementById("reportOutput");
  if (reportSelect && reportOutput) {
    const reportSamples = {
      rooms: `
        <table>
          <thead>
            <tr><th>Department</th><th>Available Rooms</th><th>Open Beds</th></tr>
          </thead>
          <tbody>
            <tr><td>Cardiology</td><td>5</td><td>8</td></tr>
            <tr><td>Emergency</td><td>2</td><td>3</td></tr>
            <tr><td>ICU</td><td>1</td><td>1</td></tr>
          </tbody>
        </table>`,
      admitted: `
        <table>
          <thead>
            <tr><th>Department</th><th>Patients Admitted</th></tr>
          </thead>
          <tbody>
            <tr><td>Cardiology</td><td>16</td></tr>
            <tr><td>Emergency</td><td>11</td></tr>
            <tr><td>Pediatrics</td><td>9</td></tr>
          </tbody>
        </table>`,
      occupancy: `
        <table>
          <thead>
            <tr><th>Room Type</th><th>Total Rooms</th><th>Occupied</th><th>Occupancy Rate</th></tr>
          </thead>
          <tbody>
            <tr><td>Standard</td><td>20</td><td>14</td><td>70%</td></tr>
            <tr><td>ICU</td><td>6</td><td>5</td><td>83%</td></tr>
            <tr><td>VIP</td><td>4</td><td>2</td><td>50%</td></tr>
          </tbody>
        </table>`,
      patientcount: `
        <table>
          <thead>
            <tr><th>Department</th><th>Patient Count</th></tr>
          </thead>
          <tbody>
            <tr><td>Cardiology</td><td>16</td></tr>
            <tr><td>Oncology</td><td>12</td></tr>
            <tr><td>Emergency</td><td>11</td></tr>
          </tbody>
        </table>`
    };

    const renderReport = () => {
      const key = reportSelect.value;
      reportOutput.innerHTML = reportSamples[key] || '<div class="empty-state">Select a preset report to preview the output table.</div>';
    };

    reportSelect.addEventListener("change", renderReport);
    renderReport();
  }

  document.querySelectorAll("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const target = form.dataset.demoForm;
      if (target) {
        window.location.href = target;
      } else {
        alert("the form does not submit to a database yet.");
      }
    });
  });

  fetch("doctor_api.php")
  .then(res => res.json())
  .then(data => {
    let html = "";

    data.forEach(d => {

      const onShiftd = d.is_on_shift === "1" ? "Yes" : "No";

      html += `
        <tr>
          <td>${d.first_name}</td>
          <td>${d.last_name}</td>
          <td>${d.doctor_id}</td>
          <td>${d.department_id}</td>
          <td>${d.shift_start}</td>
          <td>${d.shift_end}</td>
          <td>${onShiftd}</td>
          <td><a class="btn btn-outline" href="add_doctor.html">Edit</a></td>
        </tr>
      `;
    });

      const el = document.getElementById("doctorTable");
      if (el) el.innerHTML = html;
  });

  fetch("nurse_api.php")
  .then(res => res.json())
  .then(data => {
    let html = "";

    data.forEach(n => {

      const onShiftn = n.is_on_shift === "1" ? "Yes" : "No";

      html += `
        <tr>
          <td>${n.first_name}</td>
          <td>${n.last_name}</td>
          <td>${n.nurse_id}</td>
          <td>${n.department_id}</td>
          <td>${n.shift_start}</td>
          <td>${n.shift_end}</td>
          <td>${onShiftn}</td>
          <td><a class="btn btn-outline" href="add_nurse.html">Edit</a></td>
        </tr>
      `;
    });

      const el = document.getElementById("nurseTable");
      if (el) el.innerHTML = html;
  });

  fetch("patient_api.php")
  .then(res => res.json())
  .then(data => {

    let html = "";

    data.forEach(p => {

      let statusClass = "";

      if (p.status === "Critical") {
        statusClass = "danger";
      } else if (p.status === "Stable") {
        statusClass = "success";
      } else if (p.status === "Recovering") {
        statusClass = "warning";
      }

      html += `
        <tr>
          <td>${p.patient_id}</td>
          <td>${p.first_name} ${p.last_name}</td>
          <td>${p.department_id}</td>
          <td>${p.room_num}</td>
          <td>${p.illness}</td>

          <td>
            <span class="badge ${statusClass}">
              ${p.status}
            </span>
          </td>

          <td>${p.time_admitted}</td>

          <td>
            <a class="btn btn-outline" 
               href="patient_details.html?patient_id=${p.patient_id}">
              View
            </a>
          </td>
        </tr>
      `;
    });

    const el = document.getElementById("patientTable");
    if (el) el.innerHTML = html;
  });

  fetch("department_api.php")
  .then(res => res.json())
  .then(data => {

    let html = "";

    data.forEach(d => {

      html += `
        <tr>
          <td>${d.department_id}</td>
          <td>${d.department_name}</td>
          <td>${d.department_location}</td>
          <td>${d.beds_total}</td>
          <td>${d.patient_count}</td>
          <td>
            <a class="btn btn-outline" href="add_department.html?department_id=${d.department_id}">
              Edit
            </a>
          </td>
        </tr>
      `;
    });

    const el = document.getElementById("deptTable");
    if (el) el.innerHTML = html;
  });

  fetch("room_api.php")
  .then(res => res.json())
  .then(data => {

    let html = "";

    data.forEach(r => {

      const beds = Number(r.beds_count) || 0;
      const occupied = Number(r.occupied) || 0;

      const status =
        occupied === beds ? "Full" :
        occupied === 0 ? "Empty" : "Partial";

      html += `
        <tr>
          <td>${r.room_num}</td>
          <td>${r.department_id}</td>
          <td>${r.room_type}</td>
          <td>${status}</td>
          <td>${beds}</td>
          <td>${occupied}</td>
          <td>${r.last_cleaned ?? "-"}</td>
          <td>
            <a class="btn btn-outline" href="add_room.html?room=${r.room_num}">
              Edit
            </a>
          </td>
        </tr>
      `;
    });

    const el = document.getElementById("roomTable");
    if (el) el.innerHTML = html;
  });

  const admitForm = document.getElementById("admitForm");

  if (admitForm) {
    admitForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const dobRaw = document.getElementById("dob").value;
      const DOB = dobRaw ? `${dobRaw} 00:00:00` : null;

      const patient = {
        patient_id: document.getElementById("patientId").value,
        room_num: document.getElementById("roomNumber").value,
        first_name: document.getElementById("patientFirstName").value,
        last_name: document.getElementById("patientLastName").value,
        contact_info: document.getElementById("contactInfo").value,
        gender: document.getElementById("gender").value,
        DOB: DOB,
        illness: document.getElementById("illness").value,
        time_admitted: document.getElementById("timeAdmitted").value,
        status: document.getElementById("status").value,
        insurance: document.getElementById("insurance").value,
        insurance_num: document.getElementById("insuranceNum").value,
        height: document.getElementById("height").value || null,
        weight: document.getElementById("weight").value || null
      };

      if (!patient.room_num) {
        alert("Please select a room");
        return;
      }

      try {
        const res = await fetch("patientadmit_api.php", {
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

        alert("✅ Patient admitted successfully!");

        // redirect back to patient list
        window.location.href = "patient_lookup.html";

      } catch (err) {
        console.error("Admit error:", err);
        alert("❌ " + err.message);
      }
    });
  }

  const doctorForm = document.querySelector("form");

  if (doctorForm) {
    doctorForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const doctor = {
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

        is_on_shift:
          document.getElementById("doctorOnShift").value === "Yes" ? 1 : 0
      };

      if (!doctor.department_id) {
        alert("Please select a department");
        return;
      }

      try {
        const res = await fetch("doctoradd_api.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(doctor)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Insert failed");
        }

        alert("✅ Doctor added successfully!");

        window.location.href = "staff_management.html";

      } catch (err) {
        console.error("Doctor add error:", err);
        alert("❌ " + err.message);
      }
    });
  }

  const nurseForm = document.getElementById("nurseForm");

  if (nurseForm) {
    nurseForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nurse = {
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

        is_on_shift:
          document.getElementById("nurseOnShift").value === "Yes" ? 1 : 0
      };

      if (!nurse.department_id) {
        alert("Please select a department");
        return;
      }

      try {
        const res = await fetch("nurseadd_api.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(nurse)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Insert failed");
        }

        alert("✅ Nurse added successfully!");
        window.location.href = "staff_management.html";

      } catch (err) {
        console.error("Nurse add error:", err);
        alert("❌ " + err.message);
      }
    });
  }

  const deptForm = document.getElementById("deptForm");

  if (deptForm) {
    deptForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const department = {
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
        const res = await fetch("departmentadd_api.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(department)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Insert failed");
        }

        alert("✅ Department added successfully!");
        window.location.href = "departments_management.html";

      } catch (err) {
        console.error("Department add error:", err);
        alert("❌ " + err.message);
      }
    });
  }

  const roomForm = document.querySelector("form");

  if (roomForm && document.getElementById("roomNum")) {
    roomForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const room = {
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
        const res = await fetch("roomadd_api.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(room)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Insert failed");
        }

        alert("🏥 Room added successfully!");
        window.location.href = "room_management.html";

      } catch (err) {
        console.error("Room add error:", err);
        alert("❌ " + err.message);
      }
    });
  }

  fetch("department_api.php")
  .then(res => res.json())
  .then(data => {
    const select = document.getElementById("patientDept");
    if (!select) return;

    select.innerHTML = `<option value="">Select department</option>`;

    data.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.department_id;
      opt.textContent = `${d.department_id} • ${d.department_name}`;
      select.appendChild(opt);
    });
  })
  .catch(err => console.error("Dept load error:", err));

  const deptSelect = document.getElementById("patientDept");
  const roomSelect = document.getElementById("roomNumber");

  if (deptSelect && roomSelect) {

    deptSelect.addEventListener("change", async () => {
      const dept = deptSelect.value;

      roomSelect.innerHTML = `<option value="">Choose available room</option>`;

      if (!dept) {
        roomSelect.innerHTML = `<option value="">Select department first</option>`;
        return;
      }

      try {
        const res = await fetch("room_api.php");
        const data = await res.json();

        const filtered = data.filter(r =>
          r.department_id === dept &&
          Number(r.occupied) < Number(r.beds_count)
        );

        roomSelect.innerHTML = `<option value="">Choose available room</option>`;

        filtered.forEach(r => {
          const opt = document.createElement("option");
          opt.value = r.room_num;
          opt.textContent = `${r.room_num} (${r.room_type})`;
          roomSelect.appendChild(opt);
        });

      } catch (err) {
        console.error("Room load error:", err);
        roomSelect.innerHTML = `<option value="">Error loading rooms</option>`;
      }
    });
  }

});
