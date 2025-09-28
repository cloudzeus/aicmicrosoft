import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed process...')

  // 1. Upsert Departments
  const departments = [
    { code: 'SALES', name: 'Sales', description: 'Sales and business development department' },
    { code: 'PRESALES', name: 'Presales', description: 'Technical presales and solutions department' },
    { code: 'ACCOUNTING', name: 'Accounting', description: 'Financial and accounting operations' },
    { code: 'TECHNICAL', name: 'Technical', description: 'Technical services and engineering' },
    { code: 'SUPPORT', name: 'Support', description: 'Customer support and helpdesk' },
    { code: 'HR', name: 'HR', description: 'Human resources and recruitment' },
    { code: 'OPERATIONS', name: 'Operations', description: 'Operations and project management' },
  ]

  console.log('📁 Creating departments...')
  const createdDepartments: Record<string, any> = {}
  
  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: {
        ...dept,
        isFromTenantSync: false, // Mark as local/seed data
      },
    })
    createdDepartments[dept.code] = department
    console.log(`  ✓ ${department.name} (${department.code})`)
  }

  // 2. Upsert Positions for each Department
  const positionsByDepartment = {
    SALES: [
      { name: 'Sales Rep', description: 'Sales representative' },
      { name: 'Sales Lead', description: 'Sales team lead' },
    ],
    PRESALES: [
      { name: 'Solutions Engineer', description: 'Technical solutions engineer' },
      { name: 'Bid Manager', description: 'Bid and proposal manager' },
    ],
    ACCOUNTING: [
      { name: 'Accountant', description: 'General accountant' },
      { name: 'AP/AR Specialist', description: 'Accounts payable/receivable specialist' },
    ],
    TECHNICAL: [
      { name: 'Network Engineer', description: 'Network infrastructure engineer' },
      { name: 'Field Engineer', description: 'Field service engineer' },
      { name: 'SysAdmin', description: 'Systems administrator' },
    ],
    SUPPORT: [
      { name: 'Helpdesk L1', description: 'First level helpdesk support' },
      { name: 'Helpdesk L2', description: 'Second level helpdesk support' },
    ],
    HR: [
      { name: 'HR Generalist', description: 'Human resources generalist' },
      { name: 'Recruiter', description: 'Talent acquisition specialist' },
    ],
    OPERATIONS: [
      { name: 'Project Manager', description: 'Project management specialist' },
      { name: 'Operations Coordinator', description: 'Operations coordination specialist' },
    ],
  }

  console.log('👔 Creating positions...')
  const createdPositions: Record<string, any> = {}
  
  for (const [deptCode, positions] of Object.entries(positionsByDepartment)) {
    const department = createdDepartments[deptCode]
    console.log(`  📍 Positions for ${department.name}:`)
    
    for (const position of positions) {
      // Check if position already exists for this department
      const existingPosition = await prisma.position.findFirst({
        where: {
          name: position.name,
          departmentId: department.id,
        },
      })

      const createdPosition = existingPosition || await prisma.position.create({
        data: {
          name: position.name,
          description: position.description,
          departmentId: department.id,
          isFromTenantSync: false, // Mark as local/seed data
        },
      })
      createdPositions[`${deptCode}_${position.name}`] = createdPosition
      console.log(`    ✓ ${createdPosition.name}`)
    }
  }

  // 3. Upsert DepartmentSharePoints (1-2 per department)
  console.log('🏢 Creating SharePoint sites...')
  let sharePointCount = 0
  
  for (const [deptCode, department] of Object.entries(createdDepartments)) {
    const sharePoints = [
      {
        siteId: `${department.code.toLowerCase()}-main-${crypto.randomUUID()}`,
        siteUrl: `https://aic.sharepoint.com/sites/${department.code.toLowerCase()}-main`,
        displayName: `${department.name} Main Site`,
        accessLevel: 'READ' as const,
      },
      {
        siteId: `${department.code.toLowerCase()}-projects-${crypto.randomUUID()}`,
        siteUrl: `https://aic.sharepoint.com/sites/${department.code.toLowerCase()}-projects`,
        displayName: `${department.name} Projects`,
        accessLevel: 'READ' as const,
      },
    ]

    for (const sharePoint of sharePoints) {
      await prisma.departmentSharePoint.upsert({
        where: { siteId: sharePoint.siteId },
        update: {},
        create: {
          ...sharePoint,
          departmentId: department.id,
          isFromTenantSync: false, // Mark as local/seed data
        },
      })
      sharePointCount++
      console.log(`  ✓ ${sharePoint.displayName}`)
    }
  }

  // 4. Upsert Admin User
  console.log('👤 Creating admin user...')
  const adminUser = await prisma.user.upsert({
    where: { email: 'gkozyris@aic.gr' },
    update: {
      role: 'ADMIN',
      phone: '2101234567',
      mobile: '6971234567',
      extension: '1234',
    },
    create: {
      email: 'gkozyris@aic.gr',
      name: 'George Kozyris',
      role: 'ADMIN',
      phone: '2101234567',
      mobile: '6971234567',
      extension: '1234',
      isFromTenantSync: false, // Mark as local/seed data
    },
  })
  console.log(`  ✓ Admin user: ${adminUser.email}`)

  // 5. Print summary
  console.log('\n📊 Seed Summary:')
  console.log(`  📁 Departments: ${Object.keys(createdDepartments).length}`)
  console.log(`  👔 Positions: ${Object.keys(createdPositions).length}`)
  console.log(`  🏢 SharePoint sites: ${sharePointCount}`)
  console.log(`  👤 Admin user: ${adminUser.email}`)
  
  console.log('\n🔐 Access Information:')
  console.log(`  Admin user (${adminUser.email}) has full access to all resources`)
  console.log('  Role-based access control is implemented with ADMIN privileges')
  
  console.log('\n✅ Seed process completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed process failed:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
