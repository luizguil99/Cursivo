import React, { useState, useEffect } from "react";

const subjects = [
  "Artes",
  "Sociologia",
  "Filosofia",
  "História",
  "Geografia",
  "Biologia",
  "Química",
  "Física",
  "Matemática",
  "Português",
  "Espanhol",
  "Inglês",
];

export default function ComboBoxDisciplines() {
  const [query, setQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  console.log("Current query:", query);
  console.log("Selected subjects:", selectedSubjects);
  console.log("Dropdown open:", isDropdownOpen);

  const filteredSubjects = query === ""
    ? subjects
    : subjects.filter((subject) => {
        const isMatch = subject.toLowerCase().includes(query.toLowerCase());
        console.log(`Filtering subject: ${subject}, Match: ${isMatch}`);
        return isMatch;
      });

  const handleSelect = (subject) => {
    if (!selectedSubjects.includes(subject)) {
      console.log(`Adding subject: ${subject}`);
      setSelectedSubjects([...selectedSubjects, subject]);
    }
    setIsDropdownOpen(false);
    setQuery("");
  };

  const handleRemove = (subject) => {
    console.log(`Removing subject: ${subject}`);
    setSelectedSubjects(selectedSubjects.filter((item) => item !== subject));
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest(".dropdown-container")) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="w-72 mx-auto dropdown-container">
      <div className="relative">
        <div
          className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {selectedSubjects.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {selectedSubjects.map((subject) => (
                <span
                  key={subject}
                  className="flex items-center bg-yellow-500 text-white px-2 py-1 rounded-md"
                >
                  {subject}
                  <button
                    className="ml-1 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(subject);
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </span>
          ) : (
            <span className="text-gray-400">Selecione uma matéria</span>
          )}
        </div>
        {isDropdownOpen && (
          <div className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {filteredSubjects.map((subject) => (
              <div
                key={subject}
                className="cursor-pointer select-none py-2 px-4 hover:bg-yellow-500 hover:text-white"
                onClick={() => handleSelect(subject)}
              >
                {subject}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
