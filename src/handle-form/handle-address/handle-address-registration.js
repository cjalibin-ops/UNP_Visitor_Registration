// ================= DOM =================
const provinceInput = document.getElementById("province");
const muniInput = document.getElementById("municipality");
const brgyInput = document.getElementById("barangay");

const provinceList = document.getElementById("provinceList");
const municipalityList = document.getElementById("municipalityList");
const barangayList = document.getElementById("barangayList");

// ================= API =================
const API = "https://psgc.gitlab.io/api";

// ================= DATA STORAGE =================
let provinces = [];
let municipalities = [];
let barangays = [];

// ================= LOAD PROVINCES =================
async function loadProvinces() {

  try {

    const response = await fetch(`${API}/provinces`);
    provinces = await response.json();

    provinces.sort((a, b) => a.name.localeCompare(b.name));

  } catch (error) {
    console.error("Provinces error:", error);
  }
}

// ================= PROVINCE AUTOCOMPLETE =================
function renderProvinces(search = "") {

  provinceList.innerHTML = "";

  if (search.length < 2) return;

  const filtered = provinces.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  filtered.forEach((province) => {

    const option = document.createElement("option");
    option.value = province.name;

    provinceList.appendChild(option);

  });
}

// ================= LOAD MUNICIPALITIES =================
async function loadMunicipalities(provinceName) {

  municipalityList.innerHTML = "";
  barangayList.innerHTML = "";

  municipalities = [];
  barangays = [];

  muniInput.value = "";
  brgyInput.value = "";

  const province = provinces.find(
    (p) => p.name.toLowerCase() === provinceName.toLowerCase()
  );

  if (!province) return;

  try {

    const response = await fetch(
      `${API}/provinces/${province.code}/cities-municipalities`
    );

    municipalities = await response.json();

    municipalities.sort((a, b) => a.name.localeCompare(b.name));

    municipalities.forEach((muni) => {

      const option = document.createElement("option");
      option.value = muni.name;

      municipalityList.appendChild(option);

    });

  } catch (error) {
    console.error("Municipality error:", error);
  }
}

// ================= MUNICIPALITY AUTOCOMPLETE =================
function renderMunicipalities(search = "") {

  municipalityList.innerHTML = "";

  if (search.length < 2) return;

  const filtered = municipalities.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  filtered.forEach((muni) => {

    const option = document.createElement("option");
    option.value = muni.name;

    municipalityList.appendChild(option);

  });
}

// ================= LOAD BARANGAYS =================
async function loadBarangays(municipalityName) {

  barangayList.innerHTML = "";

  barangays = [];

  brgyInput.value = "";

  const municipality = municipalities.find(
    (m) => m.name.toLowerCase() === municipalityName.toLowerCase()
  );

  if (!municipality) return;

  try {

    const response = await fetch(
      `${API}/cities-municipalities/${municipality.code}/barangays`
    );

    barangays = await response.json();

    barangays.sort((a, b) => a.name.localeCompare(b.name));

    barangays.forEach((brgy) => {

      const option = document.createElement("option");
      option.value = brgy.name;

      barangayList.appendChild(option);

    });

  } catch (error) {
    console.error("Barangay error:", error);
  }
}

// ================= BARANGAY AUTOCOMPLETE =================
function renderBarangays(search = "") {

  barangayList.innerHTML = "";

  if (search.length < 2) return;

  const filtered = barangays.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  filtered.forEach((brgy) => {

    const option = document.createElement("option");
    option.value = brgy.name;

    barangayList.appendChild(option);

  });
}

// ================= EVENTS =================

// PROVINCE
provinceInput.addEventListener("input", () => {
  renderProvinces(provinceInput.value);
});

provinceInput.addEventListener("change", async () => {
  await loadMunicipalities(provinceInput.value);
});

// MUNICIPALITY
muniInput.addEventListener("input", () => {
  renderMunicipalities(muniInput.value);
});

muniInput.addEventListener("change", async () => {
  await loadBarangays(muniInput.value);
});

// BARANGAY
brgyInput.addEventListener("input", () => {
  renderBarangays(brgyInput.value);
});

// ================= INIT =================
loadProvinces();