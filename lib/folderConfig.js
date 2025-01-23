/**
 * Email folder configuration
 * Defines the structure and filtering rules for email folders
 */

export const folderConfig = {
  // Primary folders (always visible)
  primary: [
    {
      id: 'all',
      label: 'All Mail',
      icon: 'inbox',
      filter: (email) => true, // Shows all emails
    }
  ],

  // Category folders
  categories: [
    {
      id: 'work',
      label: 'Work',
      icon: 'briefcase',
      filter: (email) => email.category === 'Work',
    },
    {
      id: 'personal',
      label: 'Personal',
      icon: 'user',
      filter: (email) => email.category === 'Personal',
    },
    {
      id: 'promotional',
      label: 'Promotional',
      icon: 'tag',
      filter: (email) => email.category === 'Promotion',
    },
    {
      id: 'newsletters',
      label: 'Newsletters',
      icon: 'newspaper',
      filter: (email) => email.category === 'Newsletter',
    },
    {
      id: 'updates',
      label: 'Updates',
      icon: 'bell',
      filter: (email) => email.category === 'Update',
    }
  ]
};
