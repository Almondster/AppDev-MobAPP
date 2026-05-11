import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "@/frontend/session";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { Shadows } from "@/constants/theme";
import { supabase } from "../../frontend/store";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const parseMoney = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
};

const formatProjectPrice = (value: unknown) => {
  if (typeof value === "string" && value.includes("₱")) return value;
  return formatCurrency(parseMoney(value));
};

// --- SKELETON COMPONENT ---
const SkeletonItem = ({ style, color }: { style: any; color: string }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[{ opacity, backgroundColor: color }, style]} />;
};

export default function CreatorDashboard() {
  const { theme, isDark } = useTheme();
  const { t: _t } = useLanguage();
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard State
  const [stats, setStats] = useState({
    todayEarnings: 0,
    yesterdayEarnings: 0,
    lastMonthEarnings: 0,
    earningsTrend: "+0%",
    avgRating: "5.0",
    totalReviews: 0,
    totalOrders: 0,
    totalViews: 0,
    totalClicks: 0,
    ordersTrend: "+0%",
    activeProjectsCount: 0,
    viewsTrend: "+0%",
    clicksTrend: "+0%",
    ratingTrend: "+0%",
  });

  const [ongoingProjects, setOngoingProjects] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // 1. Get current dashboard stats from RPC (now includes today's views/clicks)
      const { data: dashboardStatsArray, error: statsError } =
        await supabase.rpc("get_creator_dashboard_stats", {
          target_user_id: user.uid,
        });

      if (statsError) throw statsError;

      // RPC returns an array with one row, extract it
      const dashboardStats = dashboardStatsArray?.[0] || {
        total_views: 0,
        total_clicks: 0,
        today_views: 0,
        today_clicks: 0,
        active_projects: 0,
        last_month_earnings: 0,
      };

      // 1b. Get avg_rating from creator_stats view (more accurate)
      const { data: creatorStats, error: creatorStatsError } = await supabase
        .from("creator_stats")
        .select("avg_rating, total_reviews")
        .eq("firebase_uid", user.uid)
        .maybeSingle();

      if (creatorStatsError) {
        console.error("Error fetching creator stats:", creatorStatsError);
      }

      const avgRating = creatorStats?.avg_rating ?? 0;
      const totalReviews = creatorStats?.total_reviews ?? 0;

      // 2. Get dates for comparison with proper time ranges
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Create proper date ranges with time boundaries
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const yesterdayStart = new Date(yesterday);
      yesterdayStart.setHours(0, 0, 0, 0);

      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      // Format dates as YYYY-MM-DD in local timezone (not UTC)
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const yesterdayFormatted = formatLocalDate(yesterday);

      // 3. Get yesterday's analytics for trend calculations
      const { data: yesterdayAnalytics, error: analyticsError } = await supabase
        .from("daily_analytics")
        .select("profile_views, service_clicks")
        .eq("creator_id", user.uid)
        .eq("date", yesterdayFormatted)
        .maybeSingle();

      if (analyticsError) {
        console.error("Error fetching yesterday analytics:", analyticsError);
      }

      // 4. Get active orders count for today and yesterday with proper date ranges
      const {
        data: _todayOrders,
        error: todayOrdersError,
        count: todayOrdersCount,
      } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("creator_id", user.uid)
        .in("status", [
          "pending",
          "in_progress",
          "accepted",
          "delivered",
          "active",
        ])
        .is("deleted_by_creator", null)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", todayEnd.toISOString());

      const {
        data: _yesterdayOrders,
        error: yesterdayOrdersError,
        count: yesterdayOrdersCount,
      } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("creator_id", user.uid)
        .in("status", [
          "pending",
          "in_progress",
          "accepted",
          "delivered",
          "active",
        ])
        .is("deleted_by_creator", null)
        .gte("created_at", yesterdayStart.toISOString())
        .lt("created_at", yesterdayEnd.toISOString());

      if (todayOrdersError || yesterdayOrdersError) {
        console.error(
          "Error fetching order counts:",
          todayOrdersError || yesterdayOrdersError,
        );
      }

      // 5. Get rating data for trend calculation
      const { data: todayReviews, error: todayReviewsError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", user.uid)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", todayEnd.toISOString());

      const { data: yesterdayReviews, error: yesterdayReviewsError } =
        await supabase
          .from("reviews")
          .select("rating")
          .eq("reviewee_id", user.uid)
          .gte("created_at", yesterdayStart.toISOString())
          .lt("created_at", yesterdayEnd.toISOString());

      if (todayReviewsError || yesterdayReviewsError) {
        console.error(
          "Error fetching review data:",
          todayReviewsError || yesterdayReviewsError,
        );
      }

      // 6. GET EARNINGS DATA FOR TREND CALCULATION
      const { data: todayEarningsOrders, error: todayEarningsError } =
        await supabase
          .from("orders")
          .select("price, updated_at")
          .eq("creator_id", user.uid)
          .eq("status", "completed")
          .gte("updated_at", todayStart.toISOString())
          .lte("updated_at", todayEnd.toISOString());

      const { data: yesterdayEarningsOrders, error: yesterdayEarningsError } =
        await supabase
          .from("orders")
          .select("price, updated_at")
          .eq("creator_id", user.uid)
          .eq("status", "completed")
          .gte("updated_at", yesterdayStart.toISOString())
          .lte("updated_at", yesterdayEnd.toISOString());

      if (todayEarningsError || yesterdayEarningsError) {
        console.error(
          "Error fetching earnings data:",
          todayEarningsError || yesterdayEarningsError,
        );
      }

      // 7. Get ongoing projects
      const { data: projects, error: projectsError } = await supabase
        .from("orders")
        .select("*")
        .eq("creator_id", user.uid)
        .in("status", [
          "pending",
          "in_progress",
          "accepted",
          "delivered",
          "active",
        ])
        .is("deleted_by_creator", null)
        .order("created_at", { ascending: false })
        .limit(3);

      if (projectsError) throw projectsError;

      // 8. Calculate trends with improved edge case handling
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0 && current === 0) return "+0%";
        if (previous === 0) return current > 0 ? "+100%" : "+0%";
        const change = ((current - previous) / previous) * 100;
        const sign = change >= 0 ? "+" : "";
        return `${sign}${change.toFixed(0)}%`;
      };

      // Calculate average ratings
      const calculateAverageRating = (reviews: any[]) => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce(
          (acc, review) => acc + (review.rating || 0),
          0,
        );
        return sum / reviews.length;
      };

      // Calculate total earnings from orders
      const calculateTotalEarnings = (orders: any[]) => {
        if (!orders) return 0;
        return orders.reduce((total, order) => total + parseMoney(order.price), 0);
      };

      // Use today's views/clicks from RPC (now returned directly)
      const todayViews = Number(dashboardStats?.today_views) || 0;
      const todayClicks = Number(dashboardStats?.today_clicks) || 0;
      const yesterdayViews = yesterdayAnalytics?.profile_views || 0;
      const yesterdayClicks = yesterdayAnalytics?.service_clicks || 0;

      const todayOrdersCountValue = todayOrdersCount || 0;
      const yesterdayOrdersCountValue = yesterdayOrdersCount || 0;

      const todayAvgRating = calculateAverageRating(todayReviews || []);
      const yesterdayAvgRating = calculateAverageRating(yesterdayReviews || []);

      // Calculate earnings trends
      const todayEarningsValue = calculateTotalEarnings(
        todayEarningsOrders || [],
      );
      const yesterdayEarningsValue = calculateTotalEarnings(
        yesterdayEarningsOrders || [],
      );
      const earningsTrend = calculateTrend(
        todayEarningsValue,
        yesterdayEarningsValue,
      );

      // Debug logging to verify calculations
      console.log("Dashboard Stats from RPC:", {
        total_views: dashboardStats?.total_views,
        total_clicks: dashboardStats?.total_clicks,
        today_views: dashboardStats?.today_views,
        today_clicks: dashboardStats?.today_clicks,
        active_projects: dashboardStats?.active_projects,
        avg_rating: dashboardStats?.avg_rating,
        last_month_earnings: dashboardStats?.last_month_earnings,
      });

      // 9. Update State with Real Data and Trends
      setStats({
        todayEarnings: todayEarningsValue,
        yesterdayEarnings: yesterdayEarningsValue,
        lastMonthEarnings: Number(dashboardStats?.last_month_earnings) || 0,
        earningsTrend: earningsTrend,
        avgRating: avgRating > 0 ? Number(avgRating).toFixed(1) : "5.0",
        totalReviews: Number(totalReviews) || 0,
        totalOrders: Number(dashboardStats?.active_projects) || 0,
        totalViews: todayViews,
        totalClicks: todayClicks,
        ordersTrend: calculateTrend(
          todayOrdersCountValue,
          yesterdayOrdersCountValue,
        ),
        activeProjectsCount: Number(dashboardStats?.active_projects) || 0,
        viewsTrend: calculateTrend(todayViews, yesterdayViews),
        clicksTrend: calculateTrend(todayClicks, yesterdayClicks),
        ratingTrend: calculateTrend(todayAvgRating, yesterdayAvgRating),
      });

      setOngoingProjects(
        (projects || []).map((project: any) => ({
          ...project,
          price: formatProjectPrice(project.price),
          status: String(project.status || "active"),
        })),
      );
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  type IconName = React.ComponentProps<typeof Ionicons>["name"];

  // Helper function for trend colors
  const getTrendColor = (trend: string, baseColor: string) => {
    if (trend.includes("-")) return "#ef4444"; // Red for negative
    if (trend === "+0%") return "#6b7280"; // Gray for neutral
    return baseColor; // Original color for positive
  };

  // Interactions Data mapped from State with REAL trends
  const interactionsData: {
    id: number;
    title: string;
    value: string;
    icon: IconName;
    color: string;
    trend: string;
    description: string;
  }[] = [
    {
      id: 1,
      title: "Views",
      value: stats.totalViews.toString(),
      icon: "eye-outline",
      color: "#4379d1",
      trend: stats.viewsTrend,
      description: "Profile visits",
    },
    {
      id: 2,
      title: "Rating",
      value: stats.avgRating,
      icon: "star-outline",
      color: "#10b981",
      trend: stats.ratingTrend,
      description: "Average Score",
    },
    {
      id: 3,
      title: "Clicks",
      value: stats.totalClicks.toString(),
      icon: "hand-left-outline",
      color: "#f59e0b",
      trend: stats.clicksTrend,
      description: "Service Interest",
    },
    {
      id: 4,
      title: "Active Jobs",
      value: stats.activeProjectsCount.toString(),
      icon: "cart-outline",
      color: "#ef4444",
      trend: stats.ordersTrend,
      description: "In Progress",
    },
  ];

  // SKELETON LOADER
  if (loading && !refreshing) {
    const skeletonColor = isDark ? "#333" : "#e1e9ee";

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingHorizontal: 20,
            paddingTop: 20,
          },
        ]}
      >
        {/* Top Row Skeleton */}
        <View style={styles.topRow}>
          {/* Earnings Card Skeleton */}
          <View
            style={[
              styles.card,
              styles.earningsCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <SkeletonItem
                color={skeletonColor}
                style={{ width: 100, height: 16, borderRadius: 4 }}
              />
              <SkeletonItem
                color={skeletonColor}
                style={{ width: 24, height: 24, borderRadius: 12 }}
              />
            </View>
            <SkeletonItem
              color={skeletonColor}
              style={{
                width: 120,
                height: 40,
                borderRadius: 8,
                marginBottom: 20,
              }}
            />
            <SkeletonItem
              color={skeletonColor}
              style={{ width: "100%", height: 16, borderRadius: 4 }}
            />
          </View>

          {/* Stats Column Skeleton */}
          <View style={styles.statsContainer}>
            {[1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.card,
                  styles.statsCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <SkeletonItem
                  color={skeletonColor}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                />
                <SkeletonItem
                  color={skeletonColor}
                  style={{
                    width: 60,
                    height: 24,
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                />
                <SkeletonItem
                  color={skeletonColor}
                  style={{ width: 80, height: 12, borderRadius: 4 }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Interactions Grid Skeleton */}
        <View style={{ marginBottom: 24 }}>
          <SkeletonItem
            color={skeletonColor}
            style={{
              width: 150,
              height: 24,
              borderRadius: 4,
              marginBottom: 20,
            }}
          />
          <View style={styles.interactionsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.fancyCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <SkeletonItem
                  color={skeletonColor}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    marginBottom: 16,
                  }}
                />
                <SkeletonItem
                  color={skeletonColor}
                  style={{
                    width: 80,
                    height: 28,
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <SkeletonItem
                  color={skeletonColor}
                  style={{
                    width: 60,
                    height: 16,
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <SkeletonItem
                  color={skeletonColor}
                  style={{ width: "100%", height: 12, borderRadius: 4 }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Projects Skeleton */}
        <View>
          <View style={styles.projectHeader}>
            <SkeletonItem
              color={skeletonColor}
              style={{ width: 140, height: 24, borderRadius: 4 }}
            />
            <SkeletonItem
              color={skeletonColor}
              style={{ width: 60, height: 16, borderRadius: 4 }}
            />
          </View>
          {[1].map((i) => (
            <View
              key={i}
              style={[
                styles.card,
                styles.projectCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  marginBottom: 12,
                },
              ]}
            >
              <View style={styles.projectContent}>
                <SkeletonItem
                  color={skeletonColor}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    marginRight: 16,
                  }}
                />
                <View
                  style={{
                    flex: 1,
                    justifyContent: "space-between",
                    height: 80,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <SkeletonItem
                      color={skeletonColor}
                      style={{ width: "60%", height: 16, borderRadius: 4 }}
                    />
                    <SkeletonItem
                      color={skeletonColor}
                      style={{ width: "20%", height: 16, borderRadius: 4 }}
                    />
                  </View>
                  <SkeletonItem
                    color={skeletonColor}
                    style={{ width: 100, height: 14, borderRadius: 4 }}
                  />
                  <SkeletonItem
                    color={skeletonColor}
                    style={{ width: 80, height: 20, borderRadius: 4 }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.text}
        />
      }
    >
      {/* Top Row - Today's Earnings and Stats Container */}
      <View style={styles.topRow}>
        {/* Today's Earnings Card */}
        <View
          style={[
            styles.card,
            styles.earningsCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.earningsHeader}>
            <Text style={[styles.earningsTitle, { color: theme.text }]}>
              Today's Earnings
            </Text>

            {/* REAL EARNINGS TREND BADGE */}
            <View
              style={[
                styles.trendBadge,
                {
                  backgroundColor: `${getTrendColor(stats.earningsTrend, "#10b981")}15`,
                },
              ]}
            >
              <Ionicons
                name={
                  stats.earningsTrend.includes("-")
                    ? "trending-down"
                    : "trending-up"
                }
                size={12}
                color={getTrendColor(stats.earningsTrend, "#10b981")}
              />
              <Text
                style={[
                  styles.trendText,
                  { color: getTrendColor(stats.earningsTrend, "#10b981") },
                ]}
              >
                {stats.earningsTrend}
              </Text>
            </View>
          </View>

          <Text style={[styles.earningsAmount, { color: theme.text }]}>
            {formatCurrency(stats.todayEarnings)}
          </Text>

          {/* WRAP YESTERDAY AND LAST MONTH IN A CONTAINER */}
          <View style={styles.earningsComparisonContainer}>
            {/* YESTERDAY EARNINGS */}
            <View style={styles.yesterdayContainer}>
              <Text
                style={[styles.yesterdayText, { color: theme.textSecondary }]}
              >
                Yesterday
              </Text>
              <Text
                style={[styles.yesterdayAmount, { color: theme.textSecondary }]}
              >
                {formatCurrency(stats.yesterdayEarnings)}
              </Text>
            </View>

            {/* LAST MONTH EARNINGS */}
            <View style={styles.lastMonthContainer}>
              <Text
                style={[styles.lastMonthText, { color: theme.textSecondary }]}
              >
                Last Month
              </Text>
              <Text
                style={[styles.lastMonthAmount, { color: theme.textSecondary }]}
              >
                {formatCurrency(stats.lastMonthEarnings)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Container */}
        <View style={styles.statsContainer}>
          {/* Average Time Card */}
          <View
            style={[
              styles.card,
              styles.statsCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: "rgba(67, 121, 209, 0.1)" },
              ]}
            >
              <Ionicons name="time-outline" size={24} color="#4379d1" />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>~1 hr</Text>
            <Text
              style={[styles.fancyDescription, { color: theme.textSecondary }]}
            >
              Avg Response
            </Text>
          </View>

          {/* Positive Rating Card */}
          <View
            style={[
              styles.card,
              styles.statsCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: "rgba(251, 191, 36, 0.1)" },
              ]}
            >
              <Ionicons name="star" size={24} color="#fbbf24" />
            </View>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingValue, { color: theme.text }]}>
                {stats.avgRating}
              </Text>
              <Text style={[styles.ratingMax, { color: theme.textSecondary }]}>
                /5.0
              </Text>
            </View>
            <Text
              style={[styles.fancyDescription, { color: theme.textSecondary }]}
            >
              Rating
            </Text>
          </View>
        </View>
      </View>

      {/* Fancy Interactions Section */}
      <View style={styles.interactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Interactions
          </Text>
        </View>

        <View style={styles.interactionsGrid}>
          {interactionsData.map((item) => {
            const isPositiveTrend = !item.trend.includes("-");
            const trendIcon = isPositiveTrend ? "trending-up" : "trending-down";
            const trendColor = getTrendColor(item.trend, item.color);

            return (
              <View
                key={item.id}
                style={[
                  styles.fancyCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                {/* Header with Icon and Trend */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${item.color}15` },
                    ]}
                  >
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>

                  {/* REAL WORKING TREND BADGE */}
                  <View
                    style={[
                      styles.trendBadge,
                      { backgroundColor: `${trendColor}15` },
                    ]}
                  >
                    <Ionicons name={trendIcon} size={12} color={trendColor} />
                    <Text style={[styles.trendText, { color: trendColor }]}>
                      {item.trend}
                    </Text>
                  </View>
                </View>

                {/* Main Content */}
                <View style={styles.cardContent}>
                  <Text style={[styles.fancyValue, { color: theme.text }]}>
                    {item.value}
                  </Text>
                  <Text style={[styles.fancyTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.fancyDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Ongoing Project Section */}
      <View style={styles.ongoingProjectSection}>
        <View style={styles.projectHeader}>
          <Text style={[styles.ongoingProjectTitle, { color: theme.text }]}>
            Ongoing Projects
          </Text>
          <Pressable
            style={styles.seeMoreButton}
            onPress={() => router.push("/order")}
          >
            <Text style={[styles.seeMoreText, { color: theme.tint }]}>
              View All
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.tint} />
          </Pressable>
        </View>

        {/* Dynamic Project Cards */}
        {ongoingProjects.length === 0 ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                padding: 30,
                alignItems: "center",
              },
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={40}
              color={theme.textSecondary}
              style={{ marginBottom: 10, opacity: 0.5 }}
            />
            <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
              No active projects right now.
            </Text>
          </View>
        ) : (
          ongoingProjects.map((project) => (
            <Pressable
              key={project.id}
              onPress={() =>
                router.push({ pathname: "/order", params: { id: project.id } })
              }
              style={[
                styles.card,
                styles.projectCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  marginBottom: 12,
                },
              ]}
            >
              <View style={styles.projectContent}>
                <View style={styles.imageContainer}>
                  {project.image_url ? (
                    <Image
                      source={{ uri: project.image_url }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 12,
                        backgroundColor: theme.cardBorder,
                      }}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.placeholderText}>Img</Text>
                    </View>
                  )}
                </View>

                <View style={styles.projectDetails}>
                  <View style={styles.projectHeaderRow}>
                    <Text
                      numberOfLines={1}
                      style={[styles.projectTitle, { color: theme.text }]}
                    >
                      {project.service_title || "Untitled Project"}
                    </Text>
                    <Text style={[styles.projectPrice, { color: theme.text }]}>
                      {formatProjectPrice(project.price)}
                    </Text>
                  </View>

                  <Text
                    style={[styles.clientName, { color: theme.textSecondary }]}
                  >
                    {project.client_name || "Client"}
                  </Text>

                  <View style={styles.projectMeta}>
                    <View style={styles.tagsContainer}>
                      <View
                        style={[
                          styles.revisionsButton,
                          { backgroundColor: theme.cardBorder },
                        ]}
                      >
                        <Text
                          style={[
                            styles.revisionsText,
                            { color: theme.text, textTransform: "capitalize" },
                          ]}
                        >
                          {String(project.status || "active").replace("_", " ")}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.daysBadge,
                          { backgroundColor: "rgba(67, 121, 209, 0.1)" },
                        ]}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color="#4379d1"
                        />
                        <Text style={[styles.daysText, { color: "#4379d1" }]}>
                          Active
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSpacer: {
    height: 40,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statsContainer: {
    flex: 1,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    ...Shadows.lg,
  },
  earningsCard: {
    flex: 1.3,
    justifyContent: "space-between",
  },
  statsCard: {
    minHeight: 130,
    justifyContent: "space-between",
  },
  earningsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  earningsTitle: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  earningsComparisonContainer: {
    gap: 2,
  },
  yesterdayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  yesterdayText: {
    fontSize: 12,
    fontWeight: "400",
  },
  yesterdayAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  lastMonthContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMonthText: {
    fontSize: 12,
    fontWeight: "400",
  },
  lastMonthAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.7,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  ratingMax: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.7,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.7,
  },
  interactionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  interactionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  fancyCard: {
    width: "48%",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    ...Shadows.xl,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardContent: {
    marginBottom: 8,
  },
  fancyValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  fancyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  fancyDescription: {
    fontSize: 10,
    fontWeight: "500",
    opacity: 0.7,
  },
  ongoingProjectSection: {
    marginBottom: 16,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ongoingProjectTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  projectCard: {
    width: "100%",
    padding: 20,
  },
  projectContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  imageContainer: {
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: "#6b7280",
  },
  projectDetails: {
    flex: 1,
  },
  projectHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  projectPrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  clientName: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 12,
    opacity: 0.7,
  },
  projectMeta: {
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  revisionsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  revisionsText: {
    fontSize: 12,
    fontWeight: "600",
  },
  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  daysText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
