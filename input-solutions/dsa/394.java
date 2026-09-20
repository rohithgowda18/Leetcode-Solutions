class Solution {
    public String decodeString(String s) {
        Stack<Integer> number=new Stack<>();
        Stack<Character> character=new Stack<>();
        StringBuilder ans=new StringBuilder();

        int num=0;
        for(char ch:s.toCharArray()){
            if(ch>='0' && ch<='9') num=num*10+ch-'0';
            else if(ch=='['){
                number.push(num);
                character.push('[');
                num=0;
            }
            else if(ch==']'){
                StringBuilder sb=new StringBuilder();

                while(character.peek()!='['){
                    sb.append(character.pop());
                }
                character.pop();
                sb.reverse();
                int times=number.pop();

                String str = sb.toString();
                for (int i = 0; i<times; i++) {
                    for (char c : str.toCharArray()) {
                        character.push(c);
                    }
                }
            }
            else character.push(ch);
        }

        while(!character.isEmpty()){
            ans.append(character.pop());
        }

        return ans.reverse().toString();
    }
}
