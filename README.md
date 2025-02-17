1. Enhanced Central Point Calculation:

    Weight by Travel Time: Instead of a simple average of latitude and longitude, you can calculate a weighted average based on estimated travel times. This requires an initial rough estimate of travel times from each person's location to a potential central area. This will pull the "center" towards the person who might have a longer journey due to obstacles.
    Iterative Refinement: You can use an iterative approach. Start with a rough central point, calculate travel times, adjust the central point based on those times, and repeat until the point converges to a more balanced location.

2. Route-Aware Distance:

    Use the Directions API: Instead of just the Distance Matrix API, you can use the Directions API to get detailed route information. This API provides the actual paths, considering roads, bridges, ferries, and other obstacles. You can use this to calculate more accurate travel times.   

    Polyline Encoding: The Directions API returns polylines, which are encoded representations of the route. You can use these polylines to visualize the routes on the map and even calculate distances along the actual path.

3. Obstacle Avoidance (Advanced):

    Custom Polygons: If you have data on specific obstacles (e.g., river boundaries), you can create custom polygons to represent these. You can then use algorithms to check if potential routes intersect these polygons and penalize or avoid such routes. This is more complex but can be very effective.
    Third-party Libraries: There are some third-party libraries and tools that specialize in route optimization and obstacle avoidance. You might consider integrating these into your solution.

4. Multi-Criteria Optimization:

    Combine Factors: You can incorporate other factors beyond just travel time, such as:
        Mode of Transportation: Different modes (driving, walking, transit) will have different routes and times.
        Traffic Conditions: Real-time traffic data can significantly impact travel times.   

        Cafe Preferences: You might want to consider cafe ratings, price range, or cuisine preferences.
    Weighted Scoring: Assign weights to each factor and create a scoring system to rank potential cafes.

5. User Interface Considerations:

    Visual Feedback: Display the routes on the map, highlighting any obstacles.
    Interactive Adjustments: Allow users to adjust their locations or preferences, and see the results update in real time.
    Multiple Options: Provide a few different cafe options with their respective travel times and scores, allowing the group to choose the best compromise.

Example (Conceptual - with Directions API):

    Person A: Address -> Geocoding API -> Lat/Lng A
    Person B: Address -> Geocoding API -> Lat/Lng B
    Initial Center: (Lat A + Lat B) / 2, (Lng A + Lng B) / 2
    Directions API: Get routes from Lat/Lng A and Lat/Lng B to the initial center.
    Calculate actual travel times from the Directions API results.
    Adjust the center based on the travel times (e.g., shift it towards the person with the longer time).
    Repeat steps 4-6 until the center converges.
    Places API: Search for cafes near the refined center.
    Directions API: Get routes from Lat/Lng A and Lat/Lng B to each cafe.
    Calculate travel times and scores for each cafe.
    Display results on the map.

By incorporating these techniques, you can create a more robust and accurate solution for finding equidistant cafes, even with obstacles like rivers or complex terrain.