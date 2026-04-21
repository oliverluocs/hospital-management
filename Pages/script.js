
document.addEventListener("DOMContentLoaded", () => {
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

    document.getElementById("doctorTable").innerHTML = html;
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

    document.getElementById("nurseTable").innerHTML = html;
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

    document.getElementById("patientTable").innerHTML = html;
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

    document.getElementById("deptTable").innerHTML = html;
  });

  fetch("room_api.php")
  .then(res => res.json())
  .then(data => {

    let html = "";

    data.forEach(r => {

      const isFilled = Number(r.is_filled);
      const beds = Number(r.beds_count);

      const full =
        isFilled === beds ? "Full" :
        isFilled === 0 ? "Empty" : "Partial";

      html += `
        <tr>
          <td>${r.room_num}</td>
          <td>${r.department_id}</td>
          <td>${r.room_type}</td>
          <td>${full}</td>
          <td>${beds}</td>
          <td>${isFilled}</td>
          <td>${r.last_cleaned ?? "-"}</td>
          <td>
            <a class="btn btn-outline" href="add_room.html?room=${r.room_num}">
              Edit
            </a>
          </td>
        </tr>
      `;
    });

    document.getElementById("roomTable").innerHTML = html;
  });

});
