'use strict';

function buildAnnexX(input) {
  return Object.freeze({
    annex: 'Annex X — Police Misconduct, Operational Exclusion and Post-Notice Continuation',
    generatedAt: new Date().toISOString(),
    sections: {
      threat_to_life: input.threats || [],
      crime_recording_failures: input.crimeRecording || [],
      custody_issues: input.custody || [],
      data_accuracy: input.dataIssues || [],
      call_handling: input.callHandling || [],
    },
    evidentialWarning: 'Derived schedule. Each entry must link to a primary exhibit before court use.',
  });
}

module.exports = {
  buildAnnexX,
};
