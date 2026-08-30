class Solution {
    public int maxDistance(String s, int k) {
        int ans=0;

        String[] dir={"NE","NW","SE","SW"};

        for(String d:dir){
            int score=0;
            int bad=0;

            for(char c:s.toCharArray()){

                if(d.indexOf(c)!= -1)score++;
                else{
                    score--;
                    bad++;
                }

                int current = score + 2 * Math.min(k, bad);

                ans = Math.max(ans, current);
            }
        }

        return ans;
    }
}