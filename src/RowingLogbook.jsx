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
    boatName: "",
    crew: [],
    kilometres: "",
    comments: "",
  });
  const [logbook, setLogbook] = useState([]);
  const [warning, setWarning] = useState("");

  const handleChange = (e) => {
    setLogEntry({ ...logEntry, [e.target.name]: e.target.value });
  };

  const handleCrewChange = (idx, value) => {
    const updated = [...logEntry.crew];
    if (updated.includes(value) && value !== "Guest") {
      setWarning("Each crew member must be unique unless marked as Guest.");
      return;
    }
    updated[idx] = value;
    setLogEntry({ ...logEntry, crew: updated });
    setWarning("");
  };

  const handleStartTour = () => {
    if (logEntry.date && logEntry.startTime && logEntry.boatName && logEntry.crew.length && logEntry.crew.every(Boolean)) {
      setLogbook([...logbook, { ...logEntry, endTime: "", status: "onTheWater" }]);
      setLogEntry({ date: getCurrentDate(), startTime: getCurrentTime(), endTime: "", boatName: "", crew: [], kilometres: "", comments: "" });
      setWarning("");
    } else {
      setWarning("Please complete date, start time, boat and crew information.");
    }
  };

  const handleCloseTour = async () => {
    if (!logEntry.endTime) {
      setLogEntry({ ...logEntry, endTime: getCurrentTime() });
      setWarning("Please confirm or adjust the end time before saving.");
      return;
    }

    const updatedLogbook = logbook.map((entry) =>
      entry.date === logEntry.date &&
      entry.startTime === logEntry.startTime &&
      entry.boatName === logEntry.boatName &&
      entry.status === "onTheWater"
        ? { ...logEntry, status: "complete" }
        : entry
    );

    setLogbook(updatedLogbook);
    setLogEntry({ date: getCurrentDate(), startTime: getCurrentTime(), endTime: "", boatName: "", crew: [], kilometres: "", comments: "" });
    setWarning("");

    try {
      await saveLogbookToGitHub(updatedLogbook);
    } catch (error) {
      console.error(error);
      setWarning("Failed to save to GitHub.");
    }
  };

  const handleRowClick = (index) => {
    const entry = logbook[index];
    if (entry.status === "onTheWater") {
      setLogEntry({ ...entry, endTime: getCurrentTime() });
    }
  };

  const boats = [
    { name: "Lyn", type: "1x" }, { name: "Torden", type: "1x" },
    { name: "Marit", type: "1x" }, { name: "Solfrid", type: "1x" },
    { name: "Mona", type: "1x" }, { name: "Cecilie", type: "1x" },
    { name: "Korona", type: "1x" }, { name: "Per Arvid", type: "1x" },
    { name: "Storm", type: "1x" }, { name: "Kristian", type: "1x" },
    { name: "Nils", type: "1x" }, { name: "Tom Espen", type: "2x" },
    { name: "Trondhjems", type: "2x" }, { name: "Tronøya", type: "2x" },
    { name: "Alphatron", type: "2x" }, { name: "Haldis", type: "2x" },
    { name: "Wintech", type: "4x" }, { name: "Knut", type: "4x" },
    { name: "Ståle", type: "4-" }, { name: "Audun", type: "4x" }
  ];

  const nifMembers = [
    "Martin Haugen", "Geir Wevang", "Ellen Anna A. Jaatun", "Solveig Berthung", "Mari Hasle Falch",
    "Elin Bergene", "Pål M. Høien", "Marte Daae-Qvale Holmemo", "Inge Norstad", "Arild Henriksen",
    "Jennifer Branlat", "Astrid Skogvang", "Eirik Skogvang", "Paul G. Bjørnerud", "Martin Gilje Jaatun",
    "Christine Høyvik", "Jakob Andreassen Jaatun", "Jennifer Mary Green", "Lars A. Jaatun",
    "Jochen Köhler", "Ole Tore Buset", "Ida-Marie Høyvik", "Vegard Djuvsland", "Ane Elinsdatter Høien Bergene",
    "Ylva Green Borgos", "Fredrik Slagstad Nyheim", "Ola Werkland Hammer", "Federico Ustolin",
    "Ole Alvin Hegle-Buchmann", "Hedvig Norstad Holmemo", "Henrik Halvorsen", "Vincent Lausselet",
    "Fredrik Slupphaug", "Jaheel Mikael Sølvhaug", "Paolo De Petris", "Florian Konert",
    "Julia B. Köhler", "Berit Köhler"
  ];

  const selectedBoat = boats.find((b) => b.name === logEntry.boatName);
  const crewCount = selectedBoat ? parseInt(selectedBoat.type) || 1 : 1;

  function sortByGivenName(members) {
    return members.sort((a, b) => a.split(" ")[0].localeCompare(b.split(" ")[0]));
  }

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans text-gray-800">
      <h1 className="text-3xl font-semibold mb-6 text-blue-700">🚣‍♀️ Rowing Logbook</h1>
      {warning && (
        <div className="text-red-600 font-semibold mb-4 bg-red-100 p-2 rounded">{warning}</div>
      )}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-10 border border-gray-200 space-y-4">
        <label className="block text-sm font-medium">Date
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" type="date" name="date" value={logEntry.date} onChange={handleChange} />
        </label>
        <label className="block text-sm font-medium">Start Time
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" type="time" name="startTime" value={logEntry.startTime} onChange={handleChange} />
        </label>
        <label className="block text-sm font-medium">End Time
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" type="time" name="endTime" value={logEntry.endTime} onChange={handleChange} />
        </label>
        <label className="block text-sm font-medium">Boat
          <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={logEntry.boatName} onChange={(e) => setLogEntry({ ...logEntry, boatName: e.target.value, crew: [] })}>
            <option value="">Select a boat</option>
            {boats.map((boat) => (
              <option key={boat.name} value={boat.name}>{boat.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">Crew</label>
        {[...Array(crewCount)].map((_, idx) => (
          <select key={idx} className="w-full border border-gray-300 rounded px-3 py-2 mb-2" value={logEntry.crew[idx] || ""} onChange={(e) => handleCrewChange(idx, e.target.value)}>
            <option value="">Select Crew Member {idx + 1}</option>
            {sortByGivenName(nifMembers).map((member) => (
              <option key={member} value={member}>{member}</option>
            ))}
            <option value="Guest">Guest</option>
          </select>
        ))}
        <label className="block text-sm font-medium">Kilometres
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" name="kilometres" placeholder="e.g. 12" value={logEntry.kilometres} onChange={handleChange} />
        </label>
        <label className="block text-sm font-medium">Comments
          <textarea className="mt-1 w-full border border-gray-300 rounded px-3 py-2" name="comments" placeholder="Optional comments" value={logEntry.comments} onChange={handleChange} />
        </label>
        <div className="flex gap-4 mt-4">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow" onClick={handleStartTour}>Submit Tour</button>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow" onClick={handleCloseTour}>Close Tour and Save</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-300">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Status</th>
              <th className="p-2">Date</th>
              <th className="p-2">Start</th>
              <th className="p-2">End</th>
              <th className="p-2">Boat</th>
              <th className="p-2">Crew</th>
              <th className="p-2">KM</th>
              <th className="p-2">Comments</th>
            </tr>
          </thead>
          <tbody>
            {logbook.map((entry, idx) => (
              <tr key={idx} onClick={() => handleRowClick(idx)} className="cursor-pointer even:bg-gray-50 hover:bg-blue-50">
                <td className="p-2">
                  <span className={clsx("inline-block w-3 h-3 rounded-full mr-2", entry.status === "onTheWater" ? "bg-red-500" : "bg-green-500")}></span>
                  <span className={entry.status === "onTheWater" ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                    {entry.status === "onTheWater" ? "On the water" : "Tour complete"}
                  </span>
                </td>
                <td className="p-2">{entry.date}</td>
                <td className="p-2">{entry.startTime}</td>
                <td className="p-2">{entry.endTime}</td>
                <td className="p-2">{entry.boatName}</td>
                <td className="p-2">{entry.crew.join(", ")}</td>
                <td className="p-2">{entry.kilometres}</td>
                <td className="p-2">{entry.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
