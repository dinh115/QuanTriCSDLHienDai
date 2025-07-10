/**
 * TO RUN THIS FILE: node seed_users.js
 * Optimized version for seeding 10k users
 */

const mongoose = require('mongoose');
const { v5: uuidv5 } = require('uuid');
const bcrypt = require('bcryptjs');

// Same UUID namespace from your User model
const UUID_NAMESPACE = '3f96061a-3a25-4f89-9ae9-abc012345678';

// User roles and statuses from your types
const roles = ['admin', 'shop_owners', 'customer'];
const statuses = ['active', 'inactive', 'suspended'];

// User schema (simplified version of your model)
const userSchema = new mongoose.Schema({
    _id: String,
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: roles, required: true },
    status: { type: String, enum: statuses, default: 'active' }
}, {
    _id: false,
    timestamps: true,
    versionKey: false
});

const User = mongoose.model('User', userSchema);

// Sample data generators
const firstNames = [
    'Anh', 'Bình', 'Châu', 'Dũng', 'Đức', 'Giang', 'Hà', 'Hải', 'Hạnh', 'Hiếu',
    'Hoa', 'Hoài', 'Hùng', 'Khánh', 'Kiên', 'Lan', 'Linh', 'Loan', 'Mai', 'Minh',
    'My', 'Nam', 'Ngân', 'Ngọc', 'Nhân', 'Nhi', 'Phát', 'Phúc', 'Phương', 'Quân',
    'Quang', 'Quỳnh', 'Sơn', 'Tâm', 'Tân', 'Thảo', 'Thành', 'Thảo', 'Thắng', 'Thảo',
    'Thịnh', 'Thu', 'Thủy', 'Trang', 'Trí', 'Trinh', 'Trung', 'Tú', 'Tuấn', 'Vân',
    'Việt', 'Vy'
];

const lastNames = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
    'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Trịnh', 'Hà', 'Mai',
    'Đoàn', 'Lâm', 'Vương', 'Phùng', 'Quách', 'Tạ', 'Tô', 'Tăng', 'Cao', 'Châu',
    'Chung', 'Đàm', 'Đào', 'Đinh', 'Giang', 'Hứa', 'Kiều', 'La', 'Lưu', 'Mạc',
    'Nghiêm', 'Ông', 'Tống', 'Triệu', 'Trương', 'Từ', 'Vi', 'Văn', 'Vương', 'Yên',
    'Quang', 'Thái', 'Phước', 'Thạch'
];

const addresses = [
    '12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    '45 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
    '78 Trần Phú, Hải Châu, Đà Nẵng',
    '23 Lê Lợi, Nha Trang, Khánh Hòa',
    '56 Nguyễn Văn Cừ, Long Biên, Hà Nội',
    '89 Phạm Văn Đồng, Thủ Đức, TP. Hồ Chí Minh',
    '34 Trường Chinh, Thanh Xuân, Hà Nội',
    '67 Điện Biên Phủ, Bình Thạnh, TP. Hồ Chí Minh',
    '90 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh',
    '21 Cách Mạng Tháng 8, Quận 3, TP. Hồ Chí Minh',
    '54 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh',
    '76 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
    '32 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
    '88 Lê Hồng Phong, Quận 10, TP. Hồ Chí Minh',
    '15 Bạch Đằng, Hải Châu, Đà Nẵng'
];

// Pre-hash password once (optimization)
let hashedPassword;

// Generate random Vietnamese phone number
function generatePhone() {
    const prefixes = ['+8490', '+8491', '+8493', '+8496', '+8497', '+8498', '+8483', '+8484', '+8485', '+8481', '+8482'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(1000000 + Math.random() * 9000000);
    return prefix + number;
}

// Generate random date of birth (18-80 years old)
function generateDateOfBirth() {
    const now = new Date();
    const minAge = 18;
    const maxAge = 80;
    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    const birthYear = now.getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = Math.floor(Math.random() * 28) + 1;
    return new Date(birthYear, birthMonth, birthDay);
}

// Generate random element from array
function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Determine role based on user number (for 10k users)
function getRoleByNumber(num) {
    if (num >= 1 && num <= 100) return 'admin';           // 100 admins
    if (num >= 101 && num <= 3100) return 'shop_owners';       // 3000 shop_owners
    if (num >= 3101 && num <= 10100) return 'customer';   // 7000 customer
    return 'customer'; // fallback
}

// Generate user data (optimized - no await for password hashing)
function generateUser(num) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const username = `user_${num.toString()}`;
    const role = getRoleByNumber(num);

    // Generate UUIDv5 based on username
    const userId = uuidv5(username, UUID_NAMESPACE);

    return {
        _id: userId,
        email: `${username}@example.com`,
        username: username,
        phone: generatePhone(),
        address: randomElement(addresses),
        dateOfBirth: generateDateOfBirth(),
        password: hashedPassword, // Use pre-hashed password
        firstName: firstName,
        lastName: lastName,
        role: role,
        status: 'active'
    };
}

// Main seeding function
async function seedUsers() {
    const startTime = Date.now();

    try {
        // Connect to MongoDB with optimized options
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/user-management';
        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to MongoDB');

        // Pre-hash password once (major optimization)
        console.log('Hashing password...');
        hashedPassword = await bcrypt.hash('password', 12);
        console.log('Password hashed successfully');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Increased batch size for better performance
        const batchSize = 100;
        const totalUsers = 10100;
        console.log(`Generating ${totalUsers} users...`);

        // Process in batches
        for (let i = 0; i < totalUsers; i += batchSize) {
            const batchStart = i + 1;
            const batchEnd = Math.min(i + batchSize, totalUsers);

            // Generate batch synchronously (no await needed)
            const users = [];
            for (let j = batchStart; j <= batchEnd; j++) {
                users.push(generateUser(j));
            }

            // Insert batch with ordered: false for better performance
            await User.insertMany(users, { ordered: false });

            const progress = ((batchEnd / totalUsers) * 100).toFixed(1);
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalUsers / batchSize)} (${users.length} users) - ${progress}%`);
        }

        // Display statistics
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('\n=== Seeding Complete ===');
        console.log(`Total time: ${duration} seconds`);
        console.log('User distribution by role:');
        stats.forEach(stat => {
            console.log(`${stat._id}: ${stat.count} users`);
        });

        const totalUsersCreated = await User.countDocuments();
        console.log(`\nTotal users created: ${totalUsersCreated}`);

        // Sample users for verification
        console.log('\n=== Sample Users ===');
        const sampleUsers = await User.find({}).limit(1).lean();
        if (sampleUsers.length > 0) {
            const sample = sampleUsers[0];
            console.log('Sample User:', {
                id: sample._id,
                username: sample.username,
                email: sample.email,
                role: sample.role,
                firstName: sample.firstName,
                lastName: sample.lastName
            });
        }

    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the seeder
if (require.main === module) {
    seedUsers().catch(console.error);
}

module.exports = { seedUsers };