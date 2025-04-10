# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-04-10

### Added

- Enhanced Mautic detection with improved tracking capabilities
- Page title tracking support in storage system
- Debug logging throughout the application
- Network request detection for mtc.js
- New storage management system with URL normalization
- Message handling for tab ID requests
- New dependencies:
  - date-fns (^4.1.0)
  - add (^2.0.6)
  - autoprefixer, postcss, tailwindcss (dev dependencies)

### Changed

- Complete overhaul of storage management system
- Enhanced badge system with improved colors and tooltips
- Improved URL validation and handling
- Updated storage service with new types and interfaces
- Enhanced error handling and logging throughout
- Improved injection service with better error management

### Fixed

- Badge display states for various detection scenarios
- URL normalization for consistent storage
- Tab URL validation

### Added Types

- New TypeScript interfaces:
  - TrackerInfo
  - MauticData
  - CurrentPageDomains
  - StorageStructure
- Enhanced PageEntry type with title field

### Security

- Added proper URL validation for tab operations
- Improved domain tracking security measures
