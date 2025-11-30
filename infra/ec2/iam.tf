# EC2가 사용하는 IAM Role
resource "aws_iam_role" "ec2_role" {
  name = var.ec2_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# SSM 접근 권한 (Session Manager 등)
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance Profile (EC2에 Role 부착용)
resource "aws_iam_instance_profile" "profile" {
  name = var.ec2_instance_profile_name
  role = aws_iam_role.ec2_role.name
}