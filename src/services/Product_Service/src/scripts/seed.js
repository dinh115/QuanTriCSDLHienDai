import mongoose from 'mongoose';
import Product from '../models/product_schema.js';
import { connectDB } from '../configs/db.js';
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = '3f96061a-3a25-4f89-9ae9-abc012345678';

// Determine role based on user number
function getRoleByNumber(num) {
    if (num >= 1 && num <= 100) return 'admin';
    if (num >= 101 && num <= 3100) return 'shop_owner';
    if (num >= 3101 && num <= 10100) return 'customer';
    return 'customer'; // fallback
}

// Generate UserID from username
function generateUserId(username) {
    return uuidv5(username, NAMESPACE);
}

// Generate ShopID from shop name
function generateShopId(shopName) {
    return uuidv5(shopName, NAMESPACE);
}

// Generate ProductID from product name + shopId
function generateProductId(productName, shopId) {
    return uuidv5(`${productName}_${shopId}`, NAMESPACE);
}

// Danh mục sản phẩm và danh mục con
const categories = {
    'Điện tử': ['Âm thanh', 'Điện thoại thông minh', 'Laptop', 'Máy ảnh', 'Trò chơi', 'Phụ kiện'],
    'Thời trang': ['Quần áo', 'Giày dép', 'Túi xách', 'Trang sức', 'Đồng hồ', 'Kính mát'],
    'Nhà cửa & Vườn': ['Nội thất', 'Trang trí', 'Nhà bếp', 'Chăn ga', 'Dụng cụ', 'Ngoài trời'],
    'Sức khỏe & Làm đẹp': ['Chăm sóc da', 'Trang điểm', 'Chăm sóc tóc', 'Thực phẩm bổ sung', 'Thể hình', 'Chăm sóc cá nhân'],
    'Thể thao & Ngoài trời': ['Thiết bị thể thao', 'Dụng cụ ngoài trời', 'Quần áo thể thao', 'Thể thao đồng đội', 'Thể thao dưới nước', 'Xe đạp'],
    'Sách & Truyền thông': ['Sách', 'Phim', 'Nhạc', 'Trò chơi', 'Tạp chí', 'Giáo dục'],
    'Đồ chơi & Trò chơi': ['Nhân vật hành động', 'Trò chơi bàn', 'Đồ chơi giáo dục', 'Búp bê', 'Xếp hình', 'Đồ chơi ngoài trời'],
    'Ô tô & Xe máy': ['Phụ tùng ô tô', 'Phụ tùng xe máy', 'Phụ kiện xe', 'Dụng cụ', 'Dầu nhớt', 'Lốp xe'],
    'Thực phẩm & Đồ uống': ['Đồ ăn vặt', 'Đồ uống', 'Hữu cơ', 'Quốc tế', 'Làm bánh', 'Gia vị'],
    'Đồ dùng thú cưng': ['Chó', 'Mèo', 'Cá', 'Chim', 'Bò sát', 'Thú nhỏ']
};

// Danh sách thương hiệu theo danh mục
const brands = {
    'Điện tử': ['Sony', 'Samsung', 'Apple', 'LG', 'Panasonic', 'Xiaomi', 'Huawei', 'Canon', 'Nikon', 'Dell', 'HP', 'Asus', 'Lenovo'],
    'Thời trang': ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Gucci', 'Louis Vuitton', 'Chanel', 'Prada', 'Versace'],
    'Nhà cửa & Vườn': ['IKEA', 'Philips', 'Bosch', 'KitchenAid', 'Dyson', 'Shark', 'Black+Decker', 'DeWalt'],
    'Sức khỏe & Làm đẹp': ['L\'Oreal', 'Maybelline', 'Clinique', 'Estee Lauder', 'Neutrogena', 'Olay', 'Dove', 'Nivea'],
    'Thể thao & Ngoài trời': ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok', 'New Balance', 'Columbia', 'North Face'],
    'Sách & Truyền thông': ['Penguin', 'Harper Collins', 'Random House', 'Scholastic', 'Marvel', 'DC Comics'],
    'Đồ chơi & Trò chơi': ['LEGO', 'Mattel', 'Hasbro', 'Fisher-Price', 'Playskool', 'Nerf', 'Hot Wheels'],
    'Ô tô & Xe máy': ['Bosch', 'Castrol', 'Mobil', 'Shell', 'Michelin', 'Goodyear', 'Bridgestone'],
    'Thực phẩm & Đồ uống': ['Coca-Cola', 'Pepsi', 'Nestle', 'Unilever', 'Kraft', 'General Mills', 'Kellogg'],
    'Đồ dùng thú cưng': ['Purina', 'Hill\'s', 'Royal Canin', 'Whiskas', 'Pedigree', 'IAMS', 'Blue Buffalo']
};

// Mẫu tên sản phẩm
const productNameTemplates = {
    'Điện tử': [
        'Tai nghe không dây', 'Điện thoại thông minh', 'Laptop', 'TV thông minh', 'Máy tính bảng', 'Đồng hồ thông minh', 'Loa Bluetooth',
        'Máy chơi game', 'Máy ảnh kỹ thuật số', 'Flycam', 'Sạc dự phòng', 'Sạc không dây', 'Cáp USB', 'Thẻ nhớ'
    ],
    'Thời trang': [
        'Áo thun', 'Quần jeans', 'Đầm', 'Áo khoác', 'Giày thể thao', 'Boots', 'Túi xách', 'Balo', 'Đồng hồ', 'Kính mát',
        'Thắt lưng', 'Khăn choàng', 'Mũ', 'Găng tay', 'Tất', 'Đồ lót'
    ],
    'Nhà cửa & Vườn': [
        'Sofa', 'Bàn ăn', 'Khung giường', 'Nệm', 'Gối', 'Chăn', 'Rèm cửa', 'Đèn', 'Gương',
        'Máy pha cà phê', 'Máy xay sinh tố', 'Máy hút bụi', 'Máy lọc không khí', 'Máy tạo ẩm'
    ],
    'Sức khỏe & Làm đẹp': [
        'Kem dưỡng da', 'Serum', 'Sữa rửa mặt', 'Kem dưỡng ẩm', 'Kem chống nắng', 'Son môi', 'Kem nền', 'Mascara',
        'Dầu gội', 'Dầu xả', 'Sữa dưỡng thể', 'Nước hoa', 'Vitamin', 'Thực phẩm bổ sung'
    ],
    'Thể thao & Ngoài trời': [
        'Giày chạy bộ', 'Thảm yoga', 'Bộ tạ', 'Dây kháng lực', 'Máy chạy bộ', 'Xe đạp', 'Lều cắm trại',
        'Túi ngủ', 'Giày leo núi', 'Balo', 'Bình nước', 'Bột protein'
    ],
    'Sách & Truyền thông': [
        'Tiểu thuyết', 'Sách giáo khoa', 'Sách nấu ăn', 'Hồi ký', 'Sách tự lực', 'Sách thiếu nhi', 'Truyện tranh',
        'Tạp chí', 'DVD', 'Blu-ray', 'Trò chơi điện tử', 'Trò chơi bàn'
    ],
    'Đồ chơi & Trò chơi': [
        'Nhân vật hành động', 'Búp bê', 'Khối xếp hình', 'Xếp hình', 'Trò chơi bàn', 'Bài', 'Ô tô điều khiển',
        'Thú nhồi bông', 'Bộ vẽ', 'Bộ khoa học', 'Nhạc cụ', 'Đồ chơi giáo dục'
    ],
    'Ô tô & Xe máy': [
        'Dầu động cơ', 'Má phanh', 'Lọc gió', 'Bugi', 'Ắc quy', 'Lốp xe', 'Sáp đánh bóng', 'Bạt phủ xe',
        'Camera hành trình', 'Định vị GPS', 'Sạc xe hơi', 'Bọc ghế'
    ],
    'Thực phẩm & Đồ uống': [
        'Mì ăn liền', 'Cà phê', 'Trà', 'Nước tăng lực', 'Thanh protein', 'Bánh quy', 'Sô cô la', 'Kẹo',
        'Bánh quy', 'Nước ép', 'Nước ngọt', 'Nước khoáng', 'Dầu ăn', 'Gia vị'
    ],
    'Đồ dùng thú cưng': [
        'Thức ăn cho chó', 'Thức ăn cho mèo', 'Đồ chơi thú cưng', 'Giường thú cưng', 'Dây dắt', 'Vòng cổ', 'Lồng vận chuyển', 'Khay vệ sinh',
        'Bát ăn', 'Bát uống', 'Dầu gội thú cưng', 'Bánh thưởng', 'Bể cá', 'Thức ăn cho cá'
    ]
};

// Mẫu mô tả sản phẩm
const descriptionTemplates = [
    'Sản phẩm chất lượng cao với độ bền và hiệu suất tuyệt vời',
    'Vật liệu và gia công cao cấp đảm bảo sử dụng lâu dài',
    'Thiết kế sáng tạo kết hợp chức năng cho phong cách hiện đại',
    'Sự kết hợp hoàn hảo giữa phong cách, thoải mái và tiện ích',
    'Công nghệ tiên tiến và thiết kế tinh tế trong một sản phẩm',
    'Thương hiệu uy tín với lịch sử chất lượng đã được kiểm chứng',
    'Quy trình sản xuất thân thiện với môi trường và bền vững',
    'Thiết kế thân thiện với người dùng, dễ sử dụng và tiện lợi',
    'Chất lượng chuyên nghiệp phù hợp cho cá nhân và thương mại',
    'Thiết kế nhỏ gọn, dễ mang theo mà vẫn đảm bảo hiệu suất'
];

// Sinh thông số kỹ thuật ngẫu nhiên
function generateSpecs(category) {
    const specs = {};

    switch (category) {
        case 'Điện tử':
            specs.thờiLượngPin = `${Math.floor(Math.random() * 48) + 4} giờ`;
            specs.bảoHành = `${Math.floor(Math.random() * 3) + 1} năm`;
            specs.trọngLượng = `${Math.floor(Math.random() * 2000) + 50}g`;
            break;
        case 'Thời trang':
            specs.chấtLiệu = ['Cotton', 'Polyester', 'Da', 'Lụa', 'Len'][Math.floor(Math.random() * 5)];
            specs.kíchCỡ = ['XS', 'S', 'M', 'L', 'XL', 'XXL'][Math.floor(Math.random() * 6)];
            specs.màuSắc = ['Đen', 'Trắng', 'Xanh', 'Đỏ', 'Xanh lá', 'Vàng'][Math.floor(Math.random() * 6)];
            break;
        case 'Nhà cửa & Vườn':
            specs.kíchThước = `${Math.floor(Math.random() * 200) + 20}cm x ${Math.floor(Math.random() * 200) + 20}cm`;
            specs.chấtLiệu = ['Gỗ', 'Kim loại', 'Nhựa', 'Kính', 'Vải'][Math.floor(Math.random() * 5)];
            specs.bảoHành = `${Math.floor(Math.random() * 5) + 1} năm`;
            break;
        default:
            specs.bảoHành = `${Math.floor(Math.random() * 2) + 1} năm`;
            specs.trọngLượng = `${Math.floor(Math.random() * 1000) + 100}g`;
    }

    return specs;
}

// Sinh thẻ tag ngẫu nhiên
function generateTags(category, productName) {
    const commonTags = ['bán chạy', 'mới', 'cao cấp', 'giảm giá', 'xu hướng'];
    const categoryTags = {
        'Điện tử': ['không dây', 'bluetooth', 'thông minh', 'kỹ thuật số', 'di động'],
        'Thời trang': ['thời trang', 'thoải mái', 'trendy', 'cổ điển', 'casual'],
        'Nhà cửa & Vườn': ['bền', 'hiện đại', 'nhỏ gọn', 'tiết kiệm', 'thân thiện môi trường'],
        'Sức khỏe & Làm đẹp': ['tự nhiên', 'hữu cơ', 'chống lão hóa', 'dưỡng ẩm', 'nhẹ dịu'],
        'Thể thao & Ngoài trời': ['thể thao', 'ngoài trời', 'chống nước', 'nhẹ', 'bền'],
        'Sách & Truyền thông': ['giáo dục', 'giải trí', 'bán chạy', 'giải thưởng', 'kinh điển'],
        'Đồ chơi & Trò chơi': ['giáo dục', 'vui nhộn', 'an toàn', 'tương tác', 'sáng tạo'],
        'Ô tô & Xe máy': ['hiệu suất', 'đáng tin cậy', 'bền', 'tương thích', 'tiết kiệm'],
        'Thực phẩm & Đồ uống': ['lành mạnh', 'hữu cơ', 'tự nhiên', 'tươi', 'ngon'],
        'Đồ dùng thú cưng': ['an toàn', 'dinh dưỡng', 'bền', 'thoải mái', 'tự nhiên']
    };

    const tags = [];

    // Thêm 2-3 thẻ chung
    for (let i = 0; i < Math.floor(Math.random() * 2) + 2; i++) {
        const tag = commonTags[Math.floor(Math.random() * commonTags.length)];
        if (!tags.includes(tag)) tags.push(tag);
    }

    // Thêm 1-2 thẻ theo danh mục
    const catTags = categoryTags[category] || [];
    for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
        const tag = catTags[Math.floor(Math.random() * catTags.length)];
        if (!tags.includes(tag)) tags.push(tag);
    }

    return tags;
}

// Sinh URL hình ảnh
function generateImageUrls(category, count = 3) {
    const imageKeywords = {
        'Điện tử': ['công nghệ', 'điện tử', 'thiết bị'],
        'Thời trang': ['thời trang', 'quần áo', 'phong cách'],
        'Nhà cửa & Vườn': ['nhà cửa', 'nội thất', 'trang trí'],
        'Sức khỏe & Làm đẹp': ['làm đẹp', 'chăm sóc da', 'mỹ phẩm'],
        'Thể thao & Ngoài trời': ['thể thao', 'ngoài trời', 'tập luyện'],
        'Sách & Truyền thông': ['sách', 'đọc sách', 'giáo dục'],
        'Đồ chơi & Trò chơi': ['đồ chơi', 'trẻ em', 'trò chơi'],
        'Ô tô & Xe máy': ['ô tô', 'xe máy', 'phụ kiện xe'],
        'Thực phẩm & Đồ uống': ['thực phẩm', 'đồ uống', 'ẩm thực'],
        'Đồ dùng thú cưng': ['thú cưng', 'động vật', 'chăm sóc']
    };

    const keyword = imageKeywords[category] ?
        imageKeywords[category][Math.floor(Math.random() * imageKeywords[category].length)] :
        'sản phẩm';

    const images = [];
    for (let i = 0; i < count; i++) {
        images.push(`https://images.unsplash.com/photo-${Math.floor(Math.random() * 9000000000) + 1000000000}-${Math.floor(Math.random() * 9000000000) + 1000000000}?w=500&q=80&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`);
    }

    return "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m9jukzvyc226f8.webp";
}

// Sinh chủ shop (user_101 đến user_3100)
function generateShopOwners() {
    const shopOwners = [];

    for (let i = 101; i <= 3100; i++) {
        const username = `user_${i}`;
        const userId = generateUserId(username);

        // Sinh tên shop
        const shopPrefixes = ['Cửa hàng', 'Siêu thị', 'Boutique', 'Chợ', 'Phòng trưng bày', 'Trung tâm', 'Plaza'];
        const shopSuffixes = ['Express', 'Plus', 'Pro', 'Prime', 'Elite', 'Max', 'Super', 'Mega'];
        const shopName = `${shopPrefixes[Math.floor(Math.random() * shopPrefixes.length)]} ${username.replace('_', ' ')} ${shopSuffixes[Math.floor(Math.random() * shopSuffixes.length)]}`;

        const shopId = generateShopId(shopName);

        shopOwners.push({
            userId,
            username,
            shopId,
            shopName,
            productsCount: Math.floor(Math.random() * 10) + 1 // 1-10 sản phẩm mỗi shop
        });
    }

    return shopOwners;
}

// Sinh sản phẩm cho tất cả chủ shop
function generateProducts() {
    const shopOwners = generateShopOwners();
    const products = [];

    console.log(`Đang tạo sản phẩm cho ${shopOwners.length} cửa hàng...`);

    shopOwners.forEach((shop, shopIndex) => {
        console.log(`Tạo sản phẩm cho cửa hàng ${shopIndex + 1}/${shopOwners.length}: ${shop.shopName}`);

        for (let i = 0; i < shop.productsCount; i++) {
            // Chọn danh mục ngẫu nhiên
            const categoryKeys = Object.keys(categories);
            const category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
            const subcategory = categories[category][Math.floor(Math.random() * categories[category].length)];

            // Chọn thương hiệu ngẫu nhiên
            const categoryBrands = brands[category] || ['Không thương hiệu', 'Chung', 'Phổ thông'];
            const brand = categoryBrands[Math.floor(Math.random() * categoryBrands.length)];

            // Sinh tên sản phẩm
            const nameTemplates = productNameTemplates[category] || ['Sản phẩm'];
            const baseName = nameTemplates[Math.floor(Math.random() * nameTemplates.length)];
            const name = `${brand} ${baseName} ${Math.floor(Math.random() * 1000) + 1}`;

            // Sinh ID sản phẩm
            const productId = generateProductId(name, shop.shopId);

            // Sinh mô tả
            const description = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];

            // Sinh giá (1000 - 50000000 VND)
            const price = Math.floor(Math.random() * 49999000) + 1000;

            // Sinh số lượng tồn kho
            const stock = Math.floor(Math.random() * 1000) + 1;

            // Sinh hình ảnh
            const images = generateImageUrls(category, Math.floor(Math.random() * 4) + 2);

            // Sinh đánh giá và số lượng đánh giá
            const rating = Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 - 5.0
            const reviewCount = Math.floor(Math.random() * 5000) + 1;

            // Sinh thẻ tag
            const tags = generateTags(category, name);

            // Sinh thông số kỹ thuật
            const specifications = generateSpecs(category);

            // Sinh trạng thái
            const statuses = ['active', 'inactive', 'out_of_stock'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            // Sinh ngày tạo và cập nhật
            const createdAt = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)); // Trong vòng 1 năm
            const updatedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * (Date.now() - createdAt.getTime())));

            const product = {
                id: productId,
                shopId: shop.shopId,
                name,
                description,
                price,
                stock,
                category,
                subcategory,
                brand,
                image: images[0],
                images,
                status,
                rating,
                reviewCount,
                tags,
                specifications,
                createdAt,
                updatedAt
            };

            products.push(product);
        }
    });

    return products;
}

// Hàm seed chính
async function seedProducts() {
    try {
        console.log('Kết nối cơ sở dữ liệu...');
        await connectDB();

        console.log('Xóa sản phẩm cũ...');
        await Product.deleteMany({});

        console.log('Đang tạo sản phẩm...');
        const products = generateProducts();

        console.log(`Đã tạo ${products.length} sản phẩm`);
        console.log('Đang thêm sản phẩm vào cơ sở dữ liệu...');

        // Thêm theo lô để tránh tràn bộ nhớ
        const batchSize = 1000;
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            await Product.insertMany(batch);
            console.log(`Đã thêm lô ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);
        }

        console.log(`Seed thành công ${products.length} sản phẩm!`);

        // Thống kê
        const categoryStats = {};
        const shopStats = {};

        products.forEach(product => {
            categoryStats[product.category] = (categoryStats[product.category] || 0) + 1;
            shopStats[product.shopId] = (shopStats[product.shopId] || 0) + 1;
        });

        console.log('\n=== Thống kê ===');
        console.log('Số lượng sản phẩm theo danh mục:');
        Object.entries(categoryStats).forEach(([category, count]) => {
            console.log(`  ${category}: ${count} sản phẩm`);
        });

        console.log(`\nTổng số cửa hàng có sản phẩm: ${Object.keys(shopStats).length}`);
        console.log(`Trung bình sản phẩm mỗi cửa hàng: ${Math.round(products.length / Object.keys(shopStats).length)}`);

        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi seed sản phẩm:', error);
        process.exit(1);
    }
}

// Chạy seed
seedProducts();