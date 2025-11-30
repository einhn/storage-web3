# AWS Key Pair (EC2 콘솔에 올라가는 논리 키)
resource "aws_key_pair" "main" {
  key_name   = var.keypair_name
  public_key = file(var.public_key_path)
  tags       = var.common_tags
}

# 실제 EC2 인스턴스
resource "aws_instance" "main" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = data.aws_subnets.default.ids[0]
  vpc_security_group_ids      = [aws_security_group.main.id]
  associate_public_ip_address = true

  key_name             = aws_key_pair.main.key_name
  iam_instance_profile = aws_iam_instance_profile.profile.name

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
  }

  tags = var.common_tags
}