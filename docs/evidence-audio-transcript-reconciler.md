# Evidence Audio / Transcript Reconciler Wiring Spec

## Purpose

This document wires the Hook OS evidence reconciler for audio and transcript material.

It is designed to:

- crawl Dropbox / Google Drive file inventories when connector exports are available;
- identify audio and video evidence files;
- identify transcript and derived text files;
- pair audio with transcripts conservatively;
- expose untranscribed audio, orphan transcripts and duplicates;
- export a court-safe manifest without treating derived transcript text as primary evidence.

## Hook chain

```js
[
  'inventory_audio',
  'inventory_transcripts',
  'pair_audio_transcripts',
  'gap_review',
  'export_manifest'
]
```

The chain must preserve `current` between hooks and must not mutate prior hook outputs.

## Required connector input

The reconciler expects one or more connector inventory JSON files. Each file should contain file records from Dropbox, Google Drive or local exports.

Minimum expected shape:

```json
{
  "source": "dropbox|google_drive|local_export",
  "generatedAt": "ISO-8601 timestamp",
  "files": [
    {
      "id": "connector-native-id-if-known",
      "path": "/full/source/path/file.m4a",
      "name": "file.m4a",
      "extension": ".m4a",
      "mimeType": "audio/mp4",
      "sizeBytes": 123456,
      "createdAt": "ISO-8601 timestamp if known",
      "modifiedAt": "ISO-8601 timestamp if known",
      "durationSeconds": 1234,
      "hash": "sha256/md5/content hash if available",
      "url": "share or source URL if available"
    }
  ]
}
```

No credentials or tokens should ever be committed.

## Audio extensions

Recognised as primary audio/video candidates:

- `.m4a`
- `.mp3`
- `.wav`
- `.aac`
- `.mp4`
- `.mov`
- `.webm`
- `.ogg`
- `.flac`

## Transcript extensions

Recognised as transcript/document candidates:

- `.txt`
- `.docx`
- `.pdf`
- `.json`
- `.md`
- `.csv`
- `.rtf`

Also recognise filenames/folders containing:

- `otter`
- `whisper`
- `transcribe`
- `transcript`
- `transcription`
- `Transcribe2Text`

## Match rules

Matches must be graded, not asserted.

### confirmed_match

Use only where at least one of the following is true:

- exact basename match after normalisation;
- transcript explicitly references the audio filename;
- connector metadata directly links transcript to source audio.

### probable_match

Use where several softer indicators align:

- close modified/created timestamps;
- same or neighbouring folder;
- strong fuzzy basename similarity;
- matching duration or call reference inside transcript.

### possible_match

Use where the connection is plausible but weak.

### unmatched_audio

Audio/video file with no transcript candidate.

### orphan_transcript

Transcript/document file with no paired audio/video.

### duplicate_candidate

Same/similar hash, basename, size/duration, or duplicated export pattern.

## Evidence labels

Every item should carry one or more of:

- `primary_audio_candidate`
- `primary_transcript_candidate`
- `derived_transcript`
- `analysis_control_material`
- `not_primary_evidence`
- `requires_manual_verification`

## Output manifest

The final manifest should include:

```json
{
  "stage": "audio_transcript_reconciliation_manifest",
  "generatedAt": "ISO timestamp",
  "sources": [],
  "audioFiles": [],
  "transcriptFiles": [],
  "matches": [],
  "unmatchedAudio": [],
  "orphanTranscripts": [],
  "duplicateCandidates": [],
  "priorityReview": [],
  "warnings": [
    "Transcript text is derived material unless verified against source audio.",
    "Uncertain matches must not be pleaded as confirmed evidence."
  ]
}
```

## Court-safe output principle

The manifest is evidence-control material. It is not, by itself, primary evidence. Raw audio files and verified transcripts remain the evidential source.

## Practical run order

1. Export file listings from Dropbox and Google Drive.
2. Place connector inventories under `data/inventory/`.
3. Run the Hook chain.
4. Review `unmatchedAudio` first.
5. Review `orphanTranscripts` second.
6. Promote only verified pairings into the litigation bundle.

## Immediate priority

Focus first on:

- 101 / 999 call recordings;
- Otter / Transcribe2Text outputs;
- audio around death threats, rape threats, violence, property/custody issues and police call-handling failures;
- any audio whose filename suggests Scott Millard, Stuart Hardman, West Midlands Police, West Mercia Police, PSD, VRR, custody, PACE, threat-to-life or safeguarding.
