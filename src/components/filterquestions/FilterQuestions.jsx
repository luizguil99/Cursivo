import React from "react";
import Sidebar from "../courses/Sidebar";
import ComboBoxDisciplines from "./ComboboxDisciplines";

const FilterQuestions = () => {
  return (
    <div>
      <div id="container" className="flex flex-row">
        <Sidebar />

        <div className="mt-60 ml-60 space-y-6">
          <div>
            <div className="space-y-2">
              <h3>Disciplina</h3>
              <ComboBoxDisciplines />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterQuestions;
