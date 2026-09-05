# [1152. Maximum Number of Ones](https://leetcode.com/problems/maximum-number-of-ones/)

![Hard](https://img.shields.io/badge/Difficulty-Hard-red?style=for-the-badge) ![Category](https://img.shields.io/badge/Category-DSA-blue?style=for-the-badge)

No description available.

**Related Topics:**  
`Math` `Greedy` `Sorting` `Heap (Priority Queue)`

---

## 💻 Solution (Java)

```java
class Solution {
    public int maxDistance(int[] position, int m) {
        Arrays.sort(position);

        int n=position.length;
        int left=0;
        int right=position[n-1]-1;
        int ans=-1;
        while(left<=right){
            int mid=left + (right-left)/2;

            boolean temp = check(position,m,mid);
            if(temp){
                ans=Math.max(ans,mid);
                left=mid+1;
            }
            else right=mid-1;
        }

        return ans;
    }
    boolean check(int[] position,int m,int val){
        int cnt=1;
        int prev=position[0];
        for(int i=1;i<position.length;i++){
            if(position[i]-prev>=val){
                cnt++;
                prev=position[i];
            }
        }
        return cnt>=m;
    }
}
```
