import React, { useState } from "react";
import clsx from "clsx";
import { saveLogbookToGitHub } from "./api/saveLog";

const boats = [
  { name: "Lyn", type: "1x" }, { name: "Torden", type: "1x" }, { name: "Marit", type: "1x" },
  { name: "Solfrid", type: "1x" }, { name: "Mona", type: "1x" }, { name: "Cecilie", type: "1x" },
  { name: "Korona", type: "1x" }, { name: "Per Arvid", type: "1x" }, { name: "Storm", type: "1x" },
  { name: "Kristian", type: "1x" }, { name: "Nils", type: "1x" }, { name: "Tom Espen", type: "2x" },
  { name: "Trondhjems", type: "2x" }, { name: "Tronøya", type: "2x" }, { name: "Alphatron", type: "2x" },
  { name: "Haldis", type: "2x" }, { name: "Wintech", type: "4x" }, { name: "Knut", type: "4x" },
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

function sortByGivenName(members) {
  return members.sort((a, b) => a.split(" ")[0].localeCompare(b.split(" ")[0]));
}

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

  const selectedBoat = boats.find((b) => b.name === logEntry.boatName);
  const crewCount = selectedBoat ? parseInt(selectedBoat.type) || 1 : 1;

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

  const handleChange = (e) => {
    setLogEntry({ ...logEntry, [e.target.name]: e.target.value });
  };

  const handleStartTour = () => {
    if (logEntry.date && logEntry.startTime && logEntry.boatName && logEntry.crew.length === crewCount && logEntry.crew.every(Boolean)) {
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

  return (
    // ... your existing JSX
  );
}
