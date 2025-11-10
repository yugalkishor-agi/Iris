import { db } from '../config/firebase';
import { collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Test Data Generator - Run this from browser console to populate database
 * Usage: import { generateTestData } from './src/utils/testDataGenerator';
 *        generateTestData(currentUserId);
 */

export async function generateTestData(currentUserId: string) {
  console.log('🚀 Starting test data generation...');

  try {
    // Create 5 test users
    const testUsers = [
      {
        userId: 'test_user_1',
        username: 'alice_wonder',
        displayName: 'Alice Wonder',
        email: 'alice@test.com',
        bio: 'Exploring the digital wonderland 🌟',
        avatarURL: 'https://i.pravatar.cc/150?img=1',
        isPrivate: false,
        verified: false,
        stats: {
          postsCount: 5,
          followersCount: 120,
          followingCount: 85,
          storiesCount: 2,
          highlightsCount: 0,
        },
      },
      {
        userId: 'test_user_2',
        username: 'bob_builder',
        displayName: 'Bob Builder',
        email: 'bob@test.com',
        bio: 'Building dreams one brick at a time 🏗️',
        avatarURL: 'https://i.pravatar.cc/150?img=2',
        isPrivate: false,
        verified: true,
        stats: {
          postsCount: 8,
          followersCount: 450,
          followingCount: 120,
          storiesCount: 1,
          highlightsCount: 2,
        },
      },
      {
        userId: 'test_user_3',
        username: 'charlie_creative',
        displayName: 'Charlie Creative',
        email: 'charlie@test.com',
        bio: 'Artist & Designer 🎨 | Coffee lover ☕',
        avatarURL: 'https://i.pravatar.cc/150?img=3',
        isPrivate: false,
        verified: false,
        stats: {
          postsCount: 12,
          followersCount: 890,
          followingCount: 200,
          storiesCount: 3,
          highlightsCount: 5,
        },
      },
      {
        userId: 'test_user_4',
        username: 'diana_dev',
        displayName: 'Diana Dev',
        email: 'diana@test.com',
        bio: 'Full-stack developer 💻 | Tech enthusiast',
        avatarURL: 'https://i.pravatar.cc/150?img=4',
        isPrivate: false,
        verified: true,
        stats: {
          postsCount: 15,
          followersCount: 1200,
          followingCount: 300,
          storiesCount: 4,
          highlightsCount: 3,
        },
      },
      {
        userId: 'test_user_5',
        username: 'emma_explorer',
        displayName: 'Emma Explorer',
        email: 'emma@test.com',
        bio: 'Travel blogger ✈️ | Adventure seeker 🌍',
        avatarURL: 'https://i.pravatar.cc/150?img=5',
        isPrivate: false,
        verified: false,
        stats: {
          postsCount: 20,
          followersCount: 2500,
          followingCount: 150,
          storiesCount: 5,
          highlightsCount: 8,
        },
      },
    ];

    // Create users
    console.log('📝 Creating test users...');
    for (const user of testUsers) {
      await setDoc(doc(db, 'users', user.userId), {
        ...user,
        accountType: 'personal',
        isOnline: Math.random() > 0.5,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    console.log('✅ Created 5 test users');

    // Make current user follow test users
    console.log('👥 Creating follow relationships...');
    for (const user of testUsers) {
      // Current user follows test user
      await setDoc(doc(db, `users/${currentUserId}/following/${user.userId}`), {
        userId: user.userId,
        followedAt: serverTimestamp(),
        notificationsEnabled: true,
      });

      // Test user follows back
      await setDoc(doc(db, `users/${user.userId}/followers/${currentUserId}`), {
        userId: currentUserId,
        followedAt: serverTimestamp(),
        isCloseFriend: false,
      });

      // Some test users follow each other
      if (user.userId !== 'test_user_1') {
        await setDoc(doc(db, `users/test_user_1/following/${user.userId}`), {
          userId: user.userId,
          followedAt: serverTimestamp(),
          notificationsEnabled: true,
        });
      }
    }
    console.log('✅ Created follow relationships');

    // Create test posts
    console.log('📸 Creating test posts...');
    const testPosts = [
      {
        postId: 'test_post_1',
        authorId: 'test_user_1',
        caption: 'Beautiful sunset 🌅 #sunset #nature #photography',
        mediaURLs: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500'],
        tags: ['sunset', 'nature', 'photography'],
        mediaType: 'image',
      },
      {
        postId: 'test_post_2',
        authorId: 'test_user_2',
        caption: 'New building project! #architecture #construction',
        mediaURLs: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500'],
        tags: ['architecture', 'construction'],
        mediaType: 'image',
      },
      {
        postId: 'test_post_3',
        authorId: 'test_user_3',
        caption: 'Latest artwork 🎨 #art #design #creative',
        mediaURLs: ['https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=500'],
        tags: ['art', 'design', 'creative'],
        mediaType: 'image',
      },
      {
        postId: 'test_post_4',
        authorId: 'test_user_4',
        caption: 'Coding setup 💻 #coding #developer #tech',
        mediaURLs: ['https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500'],
        tags: ['coding', 'developer', 'tech'],
        mediaType: 'image',
      },
      {
        postId: 'test_post_5',
        authorId: 'test_user_5',
        caption: 'Mountain views 🏔️ #travel #adventure #mountains',
        mediaURLs: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500'],
        tags: ['travel', 'adventure', 'mountains'],
        mediaType: 'image',
      },
    ];

    for (const post of testPosts) {
      await setDoc(doc(db, 'posts', post.postId), {
        ...post,
        isPublic: true,
        location: 'Test Location',
        engagement: Math.floor(Math.random() * 1000),
        stats: {
          likesCount: Math.floor(Math.random() * 100),
          commentsCount: Math.floor(Math.random() * 50),
          sharesCount: Math.floor(Math.random() * 20),
          savesCount: Math.floor(Math.random() * 30),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    console.log('✅ Created 5 test posts');

    // Create a test conversation
    console.log('💬 Creating test conversation...');
    const conversationId = `conv_${currentUserId}_test_user_1`;
    await setDoc(doc(db, 'conversations', conversationId), {
      conversationId,
      type: 'direct',
      participantIds: [currentUserId, 'test_user_1'],
      lastMessage: {
        text: 'Hey! How are you?',
        senderId: 'test_user_1',
        createdAt: serverTimestamp(),
      },
      lastMessageAt: serverTimestamp(),
      unreadCounts: {
        [currentUserId]: 1,
        test_user_1: 0,
      },
      createdAt: serverTimestamp(),
    });

    // Add some messages
    const messageId1 = 'test_msg_1';
    await setDoc(doc(db, 'messages', messageId1), {
      messageId: messageId1,
      conversationId,
      senderId: 'test_user_1',
      text: 'Hey! How are you?',
      type: 'text',
      createdAt: serverTimestamp(),
    });

    console.log('✅ Created test conversation with messages');

    console.log('🎉 Test data generation complete!');
    console.log('📊 Summary:');
    console.log('  - 5 test users created');
    console.log('  - Follow relationships established');
    console.log('  - 5 test posts with hashtags');
    console.log('  - 1 test conversation with messages');
    console.log('\n🔍 You can now:');
    console.log('  - Search for users: alice_wonder, bob_builder, etc.');
    console.log('  - Search hashtags: #sunset, #art, #tech, etc.');
    console.log('  - View followers list');
    console.log('  - Check messages/conversations');

    return {
      success: true,
      usersCreated: testUsers.length,
      postsCreated: testPosts.length,
    };
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  }
}

// Quick function to clear test data
export async function clearTestData() {
  console.log('🗑️  Clearing test data...');
  // Note: This is a simple version. In production, use batch deletes or Cloud Functions
  console.log('⚠️  Manual deletion required - go to Firebase Console');
}
