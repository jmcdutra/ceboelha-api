/**
 * Admin Module - Public Exports
 * 
 * Models for system settings and activity logging.
 * Controller for admin panel endpoints.
 */

// Models
export { ActivityLog, type IActivityLog } from './activity-log.model'
export { SystemSettings, type ISystemSettings } from './system-settings.model'

// Controller
export { adminController } from './admin.controller'

// Service (for use in other modules)
export * as adminService from './admin.service'
