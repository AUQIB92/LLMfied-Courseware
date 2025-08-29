import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/llmfied';

async function debugAssignments() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('llmfied');
    
    console.log('🔍 Debugging Assignment Visibility Issues...\n');
    
    // 1. Check enrollments
    console.log('📚 Checking enrollments...');
    const enrollments = await db.collection('enrollments').find({
      status: 'active'
    }).toArray();
    
    console.log(`Found ${enrollments.length} active enrollments:`);
    enrollments.forEach(enrollment => {
      console.log(`  - Learner: ${enrollment.learnerId}, Course: ${enrollment.courseId}, Status: ${enrollment.status}`);
    });
    
    // 2. Check courses with assignments
    console.log('\n📖 Checking courses with assignments...');
    const courses = await db.collection('courses').find({
      status: 'published',
      'modules.assignments': { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`Found ${courses.length} published courses with assignments:`);
    
    courses.forEach(course => {
      console.log(`\n📚 Course: ${course.title} (${course._id})`);
      console.log(`  - Educator: ${course.educatorId}`);
      console.log(`  - Status: ${course.status}`);
      console.log(`  - Modules: ${course.modules?.length || 0}`);
      
      if (course.modules) {
        course.modules.forEach((module, moduleIndex) => {
          if (module.assignments && module.assignments.length > 0) {
            console.log(`    Module ${moduleIndex + 1}: ${module.title} - ${module.assignments.length} assignments`);
            module.assignments.forEach((assignment, assignmentIndex) => {
              console.log(`      Assignment ${assignmentIndex + 1}: ${assignment.title}`);
              console.log(`        - Due: ${assignment.dueDate}`);
              console.log(`        - Active: ${assignment.isActive !== false}`);
              console.log(`        - Published: ${assignment.publishedDate}`);
            });
          }
        });
      }
    });
    
    // 3. Check specific learner's enrollments and available assignments
    console.log('\n👤 Checking specific learner scenario...');
    
    if (enrollments.length > 0) {
      const sampleEnrollment = enrollments[0];
      console.log(`\nTesting with learner: ${sampleEnrollment.learnerId}`);
      
      // Get enrolled courses for this learner
      const learnerEnrollments = await db.collection('enrollments').find({
        learnerId: sampleEnrollment.learnerId,
        status: 'active'
      }).toArray();
      
      console.log(`Learner has ${learnerEnrollments.length} active enrollments`);
      
      // Get courses and check for assignments
      const enrolledCourseIds = learnerEnrollments.map(e => e.courseId);
      const enrolledCourses = await db.collection('courses').find({
        _id: { $in: enrolledCourseIds },
        status: 'published'
      }).toArray();
      
      console.log(`Found ${enrolledCourses.length} published enrolled courses`);
      
      let totalAssignments = 0;
      enrolledCourses.forEach(course => {
        console.log(`\n📚 Enrolled Course: ${course.title}`);
        if (course.modules) {
          course.modules.forEach(module => {
            if (module.assignments && module.assignments.length > 0) {
              const activeAssignments = module.assignments.filter(a => a.isActive !== false);
              totalAssignments += activeAssignments.length;
              console.log(`  Module "${module.title}": ${activeAssignments.length} active assignments`);
            }
          });
        }
      });
      
      console.log(`\n🎯 Total assignments available to learner: ${totalAssignments}`);
    }
    
    // 4. Check for any separate assignment collection (legacy)
    console.log('\n🔍 Checking for legacy assignment collection...');
    const legacyAssignments = await db.collection('assignments').find({}).toArray();
    console.log(`Found ${legacyAssignments.length} assignments in separate collection`);
    
    if (legacyAssignments.length > 0) {
      console.log('Legacy assignments found:');
      legacyAssignments.forEach(assignment => {
        console.log(`  - ${assignment.title} (Course: ${assignment.courseId})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

debugAssignments();