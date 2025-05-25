import React, { useState } from "react";
import clsx from "clsx";
import { saveLogbookToGitHub } from "./api/saveLog";

export default function RowingLogbook() {
  const getCurrentDate = () => new Date().toISOString().slice(0, 10);
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const [logEntry, setLogEntry] = useState({
    date: getCurrentDate(),
    startTime: getCurrentTime(),
    endTime: "",
    boatType: "",
    boatName: "",
    crew: [],
    kilometres: "",
    comments: "",
    status: ""
  });
  const [logbook, setLogbook] = useState([]);
  const [warning, setWarning] = useState("");

  const boats = [
    { name: "Lyn", type: "1x" },
    { name: "Torden", type: "1x" },
    { name: "Marit", type: "1x" },
    { name: "Solfrid", type: "1x" },
    { name: "Mona", type: "1x" },
    { name: "Cecilie", type: "1x" },
    { name: "Korona", type: "1x" },
    { name: "Per Arvid", type: "1x" },
    { name: "Storm", type: "1x" },
    { name: "Kristian", type: "1x" },
    { name: "Nils", type: "1x" },
    { name: "Tom Espen", type: "2x" },
    { name: "Trondhjems", type: "2x" },
    { name: "Tronøya", type: "2x" },
    { name: "Alphatron", type: "2x" },
    { name: "Haldis", type: "2x/2-" },
    { name: "Wintech", type: "4x/4-" },
    { name: "Knut", type: "4x" },
    { name: "Ståle", type: "4-" },
    { name: "Audun", type: "4x/4-" }
  ];

  const uniqueBoatTypes = [...new Set(boats.map((b) => b.type))];
  const boatOptionsByType = boats.filter((b) => b.type === logEntry.boatType);

  const nifMembers = [
    "Martin Haugen",
    "Geir Wevang",
    "Ellen Anna A. Jaatun",
    "Solveig Berthung",
    "Mari Hasle Falch",
    "Elin Bergene",
    "Pål M. Høien",
    "Marte Daae-Qvale Holmemo",
    "Inge Norstad",
    "Arild Henriksen",
    "Jennifer Branlat",
    "Astrid Skogvang",
    "Eirik Skogvang",
    "Paul G. Bjørnerud",
    "Martin Gilje Jaatun",
    "Christine Høyvik",
    "Jakob Andreassen Jaatun",
    "Jennifer Mary Green",
    "Lars A. Jaatun",
    "Jochen Köhler",
    "Ole Tore Buset",
    "Ida-Marie Høyvik",
    "Vegard Djuvsland",
    "Ane Elinsdatter Høien Bergene",
    "Ylva Green Borgos",
    "Fredrik Slagstad Nyheim",
    "Ola Werkland Hammer",
    "Federico Ustolin",
    "Ole Alvin Hegle-Buchmann",
    "Hedvig Norstad Holmemo",
    "Henrik Halvorsen",
    "Vincent Lausselet",
    "Fredrik Slupphaug",
    "Jaheel Mikael Sølvhaug",
    "Paolo De Petris",
    "Florian Konert",
    "Julia B. Köhler",
    "Berit Köhler"
  ];

  const handleChange = (e) => {
    setLogEntry({ ...logEntry, [e.target.name]: e.target.value });
  };

  const handleCrewChange = (idx, value) => {
    const updated = [...logEntry.crew];
    if (updated.includes(value) && value !== "Guest") {
      setWarning("Hver roer må være unik, med mindre det er Gjest.");
      return;
    }
    updated[idx] = value;
    setLogEntry({ ...logEntry, crew: updated });
    setWarning("");
  };

  const handleStartTour = () => {
    const selectedBoat = boats.find((b) => b.name === logEntry.boatName);
    const crewCount = selectedBoat
      ? parseInt(selectedBoat.type.match(/\d+/)) || 1
      : 1;

    // Prevent duplicate boat or crew on water
    const boatBusy = logbook.some(
      (entry) => entry.boatName === logEntry.boatName && entry.status === "påVannet"
    );
    const crewBusy = logEntry.crew.some((member) =>
      logbook.some(
        (entry) => entry.status === "påVannet" && entry.crew.includes(member)
      )
    );
    if (boatBusy) {
      setWarning("Denne båten er allerede på vannet.");
      return;
    }
    if (crewBusy) {
      setWarning("En eller flere roere er allerede på vannet.");
      return;
    }

    // Validate required fields
    if (
      logEntry.date &&
      logEntry.startTime &&
      logEntry.boatName &&
      logEntry.crew.length === crewCount &&
      logEntry.crew.every(Boolean)
    ) {
      setLogbook([
        ...logbook,
        { ...logEntry, status: "påVannet" }
      ]);
      setLogEntry({
        date: getCurrentDate(),
        startTime: getCurrentTime(),
        endTime: "",
        boatType: "",
        boatName: "",
        crew: [],
        kilometres: "",
        comments: "",
        status: ""
      });
      setWarning("");
    } else {
      setWarning("Vennligst fyll ut dato, starttid, båt og mannskap.");
    }
  };

  const handleEndTour = async () => {
    if (!(logEntry.endTime && logEntry.kilometres)) {
      setWarning("Angi kilometre og sluttid før avslutning.");
      return;
    }

    // 1. Update UI immediately
    const updated = logbook.map((e) =>
      e.boatName === logEntry.boatName && e.status === "påVannet"
        ? {
            ...e,
            endTime: logEntry.endTime,
            kilometres: logEntry.kilometres,
            comments: logEntry.comments,
            status: "fullført"
          }
        : e
    );
    setLogbook(updated);

    // 2. Prepare the entry for GitHub
    const newEntry = updated.find(
      (e) => e.boatName === logEntry.boatName && e.status === "fullført"
    );

    // 3. Fire the API call
    try {
      const res = await fetch("/api/saveLog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTours: [newEntry] })
      });
      const text = await res.text();
      console.log("saveLog response:", res.status, text);
      if (!res.ok) {
        setWarning(`Kunne ikke lagre til GitHub: ${res.status}`);
      }
    } catch (err) {
      console.error("Network error saving log:", err);
      setWarning("Nettverksfeil ved lagring til GitHub.");
    }

    // 4. Reset form
    setLogEntry({
      date: getCurrentDate(),
      startTime: getCurrentTime(),
      endTime: "",
      boatType: "",
      boatName: "",
      crew: [],
      kilometres: "",
      comments: "",
      status: ""
    });
  };

  const sortByGivenName = arr => [...arr].sort((a, b) => a.split(" ")[0].localeCompare(b.split(" ")[0]));

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans text-gray-800">
      <h1 className="text-3xl font-semibold mb-6 text-blue-700">🚣‍♀️ Trondhjems Roklub Loggbok</h1>
      {warning && <div className="text-red-600 font-semibold mb-4 bg-red-100 p-2 rounded">{warning}</div>}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-10 border border-gray-200 space-y-4">
        <label className="block text-sm font-medium">Dato
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" type="date" name="date" value={logEntry.date} onChange={handleChange} />
        </label>
        <label className="block text-sm font-medium">Starttid
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" type="time" name="startTime" value={logEntry.startTime} onChange={handleChange} />
        </label>
        <label className="block text-sm font-medium">Sluttid
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" type="time" name="endTime" value={logEntry.endTime} onChange={handleChange} />
        </label>
        <label className="block text-sm font-medium">Båttype
          <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2" name="boatType" value={logEntry.boatType} onChange={e => setLogEntry({ ...logEntry, boatType: e.target.value, boatName: "", crew: [] })}>
            <option value="">Velg båttype</option>
            {uniqueBoatTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Båt
          <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2" name="boatName" value={logEntry.boatName} onChange={e => setLogEntry({ ...logEntry, boatName: e.target.value, crew: [] })}>
            <option value="">Velg båt</option>
            {boatOptionsByType.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </label>
        {logEntry.boatName && [...Array(parseInt((boats.find(b => b.name === logEntry.boatName).type.match(/\d+/) || [1])[0]))].map((_, i) => (
          <select key={i} className="w-full border border-gray-300 rounded px-3 py-2 mb-2" value={logEntry.crew[i] || ""} onChange={e => handleCrewChange(i, e.target.value)}>
            <option value="">Velg roer {i+1}</option>
            {sortByGivenName(nifMembers).map(m => <option key={m} value={m}>{m}</option>)}
            <option value="Guest">Gjest</option>
          </select>
        ))}
        <label className="block text-sm font-medium">Kilometer
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" name="kilometres" placeholder="f.eks. 12" value={logEntry.kilometres} onChange={handleChange} />
        </label>
        <label className="block text-sm font-medium">Kommentar
          <textarea className="mt-1 w-full border border-gray-300 rounded px-3 py-2" name="comments" placeholder="Valgfri kommentar" value={logEntry.comments} onChange={handleChange} />
        </label>
        <div className="flex gap-4 mt-6">
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded shadow" onClick={handleStartTour}>🚣 På vannet</button>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow" onClick={handleEndTour}>✅ Avslutt og registrer</button>
        </div>
      </div>
      {logbook.length > 0 && (
        <div className="overflow-x-auto mt-8">
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-gray-100 text-left">
              <tr><th className="p-2">Status</th><th className="p-2">Dato</th><th className="p-2">Start</th><th className="p-2">Slutt</th><th className="p-2">Båt</th><th className="p-2">Mannskap</th><th className="p-2">KM</th><th className="p-2">Kommentar</th></tr>
            </thead>
            <tbody>
              {logbook.map((entry, i) => (
                <tr key={i} className="even:bg-gray-50 cursor-pointer" onClick={() => entry.status==="påVannet" && setLogEntry({...entry, endTime:getCurrentTime(), kilometres: "", comments: ""})}>
                  <td className="p-2"><span className={clsx("inline-block w-3 h-3 rounded-full mr-2",entry.status==="påVannet"?"bg-red-500":"bg-green-500")}></span><span className={entry.status==="påVannet"?"text-red-600 font-semibold":"text-green-600 font-semibold"}>{entry.status==="påVannet"?"På vannet":"Fullført"}</span></td>
                  <td className="p-2">{entry.date}</td><td className="p-2">{entry.startTime}</td><td className="p-2">{entry.endTime}</td><td className="p-2">{entry.boatName}</td><td className="p-2">{entry.crew.join(", ")}</td><td className="p-2">{entry.kilometres}</td><td className="p-2">{entry.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
